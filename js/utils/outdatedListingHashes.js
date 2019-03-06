// TODO: doc me up
// TODO: unit test me

let lsData = null;

try {
  lsData = JSON.parse(window.localStorage.getItem('outdatedListingHashes'));
} catch (e) {
  // pass
}

const outdatedReverse = {
  ...(lsData && lsData.outdatedReverse || {}),
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

  let changed = false;

  if (outdated[oldHash] !== newHash) {
    outdated[oldHash] = newHash;
    changed = true;
  }

  const itemWithOutdatedHashAsNew = outdatedReverse[oldHash];

  if (
    itemWithOutdatedHashAsNew &&
      outdated[itemWithOutdatedHashAsNew] !== newHash) {
    outdated[itemWithOutdatedHashAsNew] = newHash;
    changed = true;
  }

  if (changed) {
    window.localStorage.setItem('outdatedListingHashes', JSON.stringify({
      outdated,
      outdatedReverse,
    }));
  }
}

export function getNewerHash(hash) {
  if (typeof hash !== 'string' || !hash) {
    throw new Error('Please provide an hash as a non-empty string.');
  }

  return outdated[hash];
}
