/*
 * The purpose of this module is so you can associate a new hash with an old hash
 * so a subsequent fetch of the old hash can be avoided. It's mainly to account
 * for re-visiting a listing via a search provider that has not updated the hash.
 * If we already know there's a newer one, we could just bypass the old one.
 */

import sizeof from 'object-sizeof';
import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

let data = null;

try {
  data = JSON.parse(window.localStorage.getItem('outdatedListingHashes'));
} catch (e) {
  // pass
}

// prevHashes will allow us to account for the following scenario:
//
// outdated: {
//   a: 'b',
// }
//
// outdate('b', 'c');
//
// outdated: {
//   a: 'c', // without prev hashes we wouldn't be able to update
//           // this guy
//   b: 'c',
// }

data = {
  prevHashes: new Map(data && data.prevHashes || []),
  outdated: new Map(data && data.outdated || []),
};

// Maximum size of lsData. We don't want to clog up localStorage with just this
// data, so if an outdateHash call taks us over the limit, we'll prune some
// older data.
const MAX_BYTES = '200000';

const dataToJSON = () => ({
  outdated: Array.from(data.outdated.entries()),
  prevHashes: Array.from(data.prevHashes.entries()),
});

const pruneData = () => {
  while (sizeof(dataToJSON()) > MAX_BYTES) {
    const keys = [...data.outdated.keys()];
    if (keys[0]) {
      data.prevHashes.delete(data.outdated.get(keys[0]));
      data.outdated.delete(keys[0]);
    }
  }
};

/**
 * Will persist the mapping data to localStorage. For performance, the idea is to call
 * this method infrequently (maybe just on app close).
 */
export function persist() {
  window.localStorage.setItem('outdatedListingHashes',
    JSON.stringify(dataToJSON()));
}

/**
 * When you become aware that the hash for a listing is not the latest, you can
 * call this method so it is registered (and persisted to localstorage), so subsequent
 * calls for a listing with that hash can be made for the newer hash. The two areas
 * where this potentially would happen (at the time of this writing) are the Listing
 * Card and when purchase fails due to an old listing purchase attempt.
 *
 * @param {string} oldHash - The outdated hash.
 * @param {string} newHash - The current hash.
 */
export function outdateHash(oldHash, newHash) {
  if (typeof oldHash !== 'string' || !oldHash) {
    throw new Error('Please provide an oldHash as a non-empty string.');
  }

  if (typeof newHash !== 'string' || !newHash) {
    throw new Error('Please provide an newHash as a non-empty string.');
  }

  if (oldHash === newHash) {
    throw new Error('The old hash should not equal the new hash.');
  }

  const prev = data.prevHashes.get(newHash) || [];

  if (data.outdated.get(oldHash) !== newHash) {
    data.outdated.set(oldHash, newHash);
    prev.push(oldHash);

    events.trigger('newHash', {
      oldHash,
      newHash,
    });
  }

  const oldHashPrevHashes = data.prevHashes.get(oldHash);

  (oldHashPrevHashes || [])
    .forEach(prevHash => {
      data.outdated.set(prevHash, newHash);
      prev.push(prevHash);
      events.trigger('newHash', {
        oldHash: prevHash,
        newHash,
      });
    });

  if (prev.length) {
    data.prevHashes.set(newHash, [...new Set(prev)]);
  }

  pruneData();
}

/**
 * Before fetching a listing via a hash, call this method to see if a newer hash
 * is available.
 *
 * @param {string} hash - The hash you want to use to a fetch a listing with.
 * @returns {string} If there is a newer hash associated with the hash you pass in,
 *   it will be returned. Otherwise, the hash you passed in will be returned.
 */
export function getNewerHash(hash) {
  if (typeof hash !== 'string' || !hash) {
    throw new Error('Please provide an hash as a non-empty string.');
  }

  return data.outdated.get(hash) || hash;
}
