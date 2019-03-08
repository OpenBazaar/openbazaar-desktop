// TODO: doc me up
// TODO: unit test me

import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

let lsData = null;

try {
  lsData = JSON.parse(window.localStorage.getItem('outdatedListingHashes'));
} catch (e) {
  // pass
}

const prevHashes = {
  ...(lsData && lsData.prevHashes || {}),
};

const outdated = {
  ...(lsData && lsData.outdated || {}),
};

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

  let changed = false;

  if (outdated[oldHash] !== newHash) {
    outdated[oldHash] = newHash;
    prevHashes[newHash] = prevHashes[newHash] || [];
    if (!prevHashes[newHash].includes(oldHash)) {
      prevHashes[newHash].push(oldHash);
    }

    changed = true;
    events.trigger('newHash', {
      oldHash,
      newHash,
    });
  }

  const oldHashPrevHashes = prevHashes[oldHash];

  (oldHashPrevHashes || []).concat(newHash)
    .forEach(prevHash => {
      if (prevHash !== newHash) {
        outdated[prevHash] = newHash;
        changed = true;
        events.trigger('newHash', {
          oldHash: prevHash,
          newHash,
        });
      }
    });

  if (changed) {
    window.localStorage.setItem('outdatedListingHashes', JSON.stringify({
      outdated,
      prevHashes,
    }));
  }
}

// tat me up with docs
export function getNewerHash(hash) {
  if (typeof hash !== 'string' || !hash) {
    throw new Error('Please provide an hash as a non-empty string.');
  }

  return outdated[hash] || hash;
}
