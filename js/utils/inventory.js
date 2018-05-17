import $ from 'jquery';
import app from '../app';
import { Events } from 'backbone';
import { guid } from '../utils';

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
    cacheByStore[options.slug] && cacheByStore[options.slug].deferred ?
      cacheByStore[options.slug] : null;
  cacheByStore = cacheByStore && cacheByStore.deferred || null;

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
    // For crypto currency listings be sure to pass in the coinDivisibility so
    // the inventory is converted into UI readable units.
    coinDivisibility: undefined,
    ...options,
  };
  const cacheObj = opts.useCache && getCache(peerId, options);
  let deferred = $.Deferred();

  if (!opts.useCache || (!cacheObj.cacheBySlug && !cacheObj.cacheByStore)) {
    // no cached data available, need to fetch
    const url =
      `ob/inventory/${peerId}${opts.slug ? `/${opts.slug}` : ''}` +
        `${opts.useCache ? '?usecache=true' : ''}`;

    const xhr = $.get(app.getServerUrl(url))
      .done(data => {
        const inventoryData = {
          ...data,
          inventory: typeof opts.coinDivisibility === 'number' ?
            data.inventory / opts.coinDivisibility : data.inventory,
        };

        deferred.resolve(inventoryData);
        events.trigger('inventory-fetch-success', {
          peerId,
          slug: opts.slug,
          xhr,
          data: inventoryData,
        });

        setInventory(peerId, inventoryData, options);
      }).fail(failedXhr => {
        deferred.reject({
          errCode: failedXhr.statusText === 'abort' ?
            'CANCELED' : 'SERVER_ERROR',
          error: xhr.responseJSON && xhr.responseJSON.reason || '',
          statusCode: xhr.status,
        });

        events.trigger('inventory-fetch-fail', {
          peerId,
          slug: opts.slug,
          xhr,
        });

        // clear failed fetches from the cache
        const cache = inventoryCache.get(peerId);
        if (cache) {
          const cachedItem = cache.deferred === deferred ?
            cache : cache[opts.slug];
          delete cachedItem.createdAt;
          delete cachedItem.deferred;
        }
      });

    const curCache = inventoryCache.get(peerId) || {};
    const requestors = [];

    // When sending back a promise, call _getPromise() with a unique id. This will include
    // a custom abort wrapper that keeps track of which callers are tracking a request.
    // The idea is that it's important to abort request when no longer needed since these
    // are http and ipfs request that could take a while, but it's possible another view is
    // using the same request. To not have different views step on each others toes,
    // internally we will keep track of who requested a request and only cancel if all
    // requestors have canceled. (fwiw - this is all abstracted from the caller of
    // getInventory).
    deferred._getPromise = id => {
      requestors.push(id);
      const promise = deferred.promise();
      promise.abort = () => {
        requestors.splice(requestors.indexOf(id), 1);
        if (!requestors.length) xhr.abort();
      };
      return promise;
    };

    const data = {
      createdAt: Date.now(),
      deferred,
    };

    let cacheData = {
      ...curCache,
      ...data,
    };

    if (opts.slug) {
      cacheData = {
        ...curCache,
        [opts.slug]: {
          ...curCache[opts.slug] || {},
          ...data,
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

  return deferred._getPromise(guid());
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
