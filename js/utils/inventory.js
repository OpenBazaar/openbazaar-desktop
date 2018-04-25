import $ from 'jquery';
import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

// const maxCachedProfiles = 500;
// const profileCacheExpires = 1000 * 60 * 60;
// let profileCacheExpiredInterval;

const cacheExpires = 1000 * 60 * 5;
const inventoryCache = new Map();

const moo = {
  node1: {
    'charlie-chuckles': {
      inventory: 141,
      lastUpdated: 'blah',
      createAt: 'blah',
    },
    createAt: 'blah',
  },
  node2: {
    'listing1': {
      inventory: 141,
      lastUpdated: 'blah',      
    },
    'listing2': {
      inventory: 141,
      lastUpdated: 'blah',      
    }    
  }
}

// get inventory:
// if ()

function checkInventoryArgs(peerId, options = {}) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.')
  }

  if (options.slug !== undefined && typeof options.slug !== 'string') {
    throw new Error('If providing a slug, it must be provided as a string.');
  }  
}

function expireCache(peerId, options = {}) {
  checkInventoryArgs(peerId, options);
  let cached = inventoryCache.get(peerId);
  if (options.slug && cached) cached = cached[options.slug];

  if (cached) {
    cached.deferred.reject({
      errCode: 'TIMED_OUT',
      error: 'The inventory fetch timed out.',
    });
  }

  inventoryCache.delete(peerId);
}

export function getInventory(peerId, options = {}) {
  checkInventoryArgs(peerId, options);
  const slug = options.slug;
  let cached = inventoryCache.get(peerId);
  if (cached && slug) cached = cached[slug];

  // make sure the cache hasn't expired
  if (cached && Date.now() - cached.createdAt >= cacheExpires) {
    expireCache(peerId, options);
    cached = null;
  }

  if (!cached) {

  }
}

export function isFetching(peerId, options = {}) {
}
