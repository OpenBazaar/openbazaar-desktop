import $ from 'jquery';
import app from '../app';
import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

const inventoryCache = new Map();
const cacheExpires = 1000 * 60 * 5;

// todo: put in some periodic cleanup that prevents the cache from growing too large

function checkInventoryArgs(peerId, options = {}) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.');
  }

  if (options.slug !== undefined && typeof options.slug !== 'string') {
    throw new Error('If providing a slug, it must be a string.');
  }
}

function getCache(peerId, options = {}) {
  checkInventoryArgs(peerId, options);
  let cacheByStore = inventoryCache.get(peerId);
  let cacheBySlug = options.slug && cacheByStore &&
    cacheByStore[options.slug];
  cacheByStore = cacheByStore.deferred || null;

  // ensure the caches aren't expired
  [cacheByStore, cacheBySlug].forEach(cache => {
    if (cache && Date.now() - cache.createdAt >= cacheExpires) {
      if (cache.deferred) {
        cache.deferred.reject({
          errCode: 'TIMED_OUT',
          error: 'The inventory fetch timed out.',
        });
      }

      if (cache === cacheByStore) {
        cacheByStore = null;
      } else {
        cacheBySlug = null;
      }
    }
  });

  return {
    cacheByStore,
    cacheBySlug,
  };
}

function setInventory(peerId, data = {}, options = {}) {
  checkInventoryArgs(peerId, options);

  const slugs = options.slug ?
    [options.slug] : Object.keys(data);

  slugs.forEach(slug => {
    const curCache = inventoryCache.get(peerId) || {};
    const prevInventory = curCache[slug] &&
      curCache[slug].inventory;
    const curInventory = options.slug ?
      data.inventory : data[slug].inventory;

    if (curInventory !== prevInventory) {
      events.trigger('inventory-change', {
        peerId,
        slug,
        prevInventory,
        inventory: curInventory,
      });
    }
  });
}

export function getInventory(peerId, options = {}) {
  checkInventoryArgs(peerId, options);
  const opts = {
    useCache: true,
    ...options,
  };
  const cacheObj = opts.useCache && getCache(peerId, options);
  let deferred = $.Deferred();

  if (!opts.useCache || (!cacheObj.cacheBySlug && !cacheObj.cacheByStore)) {
    // no cached data available, need to fetch
    const url =
      `ob/inventory/${peerId}${opts.slug ? `/${opts.slug}` : ''}` +
        `${opts.useCache ? '?usecache=true' : ''}`;
    console.log(`fetching: ${url}`);

    const xhr = $.get(app.getServerUrl(url))
      .done(data => {
        deferred.resolve(data);
        events.trigger('inventory-fetch-success', {
          peerId,
          slug: opts.slug,
          xhr,
          data,
        });

        setInventory(peerId, data, options);
      }).fail(() => {
        deferred.reject({
          errCode: 'SERVER_ERROR',
          error: xhr.responseJSON && xhr.responseJSON.reason || '',
          statusCode: xhr.status,
        });

        events.trigger('inventory-fetch-fail', {
          peerId,
          slug: opts.slug,
          xhr,
        });
      });

    const curCache = inventoryCache.get(peerId) || {};

    let cacheData = {
      ...curCache,
      createdAt: Date.now(),
      deferred,
    };

    if (opts.slug) {
      cacheData = {
        ...curCache,
        [opts.slug]: {
          ...curCache[opts.slug] || {},
          createdAt: Date.now(),
          deferred,
        },
      };
    }

    inventoryCache.set(peerId, cacheData);

    events.trigger('inventory-fetching', {
      peerId,
      slug: opts.slug,
      xhr,
    });
  } else if (opts.slug && !cacheObj.cacheBySlug && cacheObj.cacheByStore) {
    // we want data for a slug but only have data for an entire store which
    // may or may not have that slug

    cacheObj.cacheByStore.done(data => {
      if (data[opts.slug]) {
        deferred.resolve(data[opts.slug]);
      } else {
        // going to mirror server behavior when inventory for a given slug is not
        // available
        deferred.reject({
          errCode: 'SERVER_ERROR',
          error: 'Could not find slug in inventory',
          statusCode: 500,
        });
      }
    });
  } else {
    // we have cached data to satisfy our request
    deferred = opts.slug ?
      cacheObj.cacheBySlug.deferred :
      cacheObj.cacheByStore.deferred;
  }

  return deferred.promise();
}

export function isFetching(peerId, options = {}) {
  checkInventoryArgs(peerId, options);
  const cache = inventoryCache.get(peerId);
  const fetching =
    (cache && cache.deferred && cache.deferred.state() === 'pending') ||
    (options.slug && cache && cache[options.slug] && cache[options.slug].deferred &&
      cache[options.slug].deferred.state() === 'pending');

  return fetching;
}
