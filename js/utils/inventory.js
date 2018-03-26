import $ from 'jquery';
import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

const inventoryCache = {};

function checkPeerIdSlug(peerId, slug) {
  if (typeof peerId !== 'string' || !peerId.length) {
    throw new Error('Please provide a peerId as a non-empty string.');
  }

  if (typeof slug !== 'string' || !slug.length) {
    throw new Error('Please provide a slug as a non-empty string.');
  }
}

function getCacheKey(peerId, slug) {
  checkPeerIdSlug(peerId, slug);
  return `${peerId}-${slug}`;
}

function setInventoryCache(peerId, slug, inventory) {
  checkPeerIdSlug(peerId, slug);

  if (typeof inventory !== 'number') {
    throw new Error('Please provide the inventory as a number.');
  }

  const cacheKey = getCacheKey(peerId, slug);
  const prevInventory = inventoryCache[cacheKey] ?
    inventoryCache[cacheKey].inventory : null;

  if (inventory !== prevInventory) {
    events.trigger('inventory-change', {
      peerId,
      slug,
      prevInventory,
      inventory,
    });
  }

  inventoryCache[cacheKey] = {
    ...inventoryCache[cacheKey],
    inventory,
  };
}

export function getInventory(peerId, slug, options = {}) {
  checkPeerIdSlug(peerId, slug);

  const opts = {
    // If true, if there's an already in-progress call for the inventory
    // you are requesting, it will be returned rather than kicking off a
    // new request.
    useInProgress: true,
    ...options,
  };

  const cacheKey = getCacheKey(peerId, slug);

  if (opts.useInProgress && inventoryCache[cacheKey] &&
    inventoryCache[cacheKey].xhr &&
    inventoryCache[cacheKey].xhr.state() === 'pending') {
    return inventoryCache[cacheKey];
  }

  // temporary stub for an inventory fetch. waiting on server to implement
  const iFetchDeferred = $.Deferred();

  // stub in some xhr functions like abort
  const promise = {
    ...iFetchDeferred.promise(),
    abort: () => {},
  };

  inventoryCache[cacheKey] = {
    ...inventoryCache[cacheKey],
    xhr: promise,
  };

  events.trigger('inventory-fetching', {
    peerId,
    slug,
    xhr: promise,
  });

  setTimeout(() => {
    // randomly pass or fail
    if (Math.round(Math.random() * 1)) {
      const reason = 'The waves in the ocean had no locomotion.';
      const updatedPromise = {
        ...promise,
        responseJSON: {
          reason,
        },
      };

      iFetchDeferred.reject(updatedPromise);
      events.trigger('inventory-fetch-fail', {
        peerId,
        slug,
        xhr: updatedPromise,
        reason,
      });
    } else {
      const inventory = Math.floor(Math.random() * 1000);
      setInventoryCache(peerId, slug, inventory);
      iFetchDeferred.resolve(inventory, 'great success', promise);
      events.trigger('inventory-fetch-success', {
        peerId,
        slug,
        xhr: promise,
        inventory,
      });
    }
  }, Math.floor(Math.random() * 3) * 1000); // random between 0 and 3 seconds

  return promise;
}

export function isFetching(peerId, slug) {
  checkPeerIdSlug(peerId, slug);
  const cacheKey = getCacheKey(peerId, slug);
  const cache = inventoryCache[cacheKey];
  return cache && cache.xhr && cache.xhr.state() === 'pending';
}
