// TODO: doc me up
// TODO: unit test me

// import $ from 'jquery';
// import _ from 'underscore';
import { Events } from 'backbone';
// import Listing from '../models/listing/Listing';

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

// const boom1 = {
//   prevHashes: {},
//   outdated: {},
// };

// outdateHash('aaa', 'ccc');

// const boom2 = {
//   prevHashes: {
//     ccc: [aaa],
//   },
//   outdated: {
//     aaa: 'ccc'
//   },
// };

// outdateHash('ccc', 'ddd');

// const boom3 = {
//   prevHashes: {
//     ddd: [ccc, aaa],
//   },
//   outdated: {
//     aaa: 'ddd',
//     ccc: 'ddd',
//   },
// };

// outdateHash('ddd', 'eee');

// const boom4 = {
//   prevHashes: {
//     eee: [aaa, ccc, ddd],
//   },
//   outdated: {
//     aaa: 'eee',
//     ccc: 'eee',
//     ddd: 'eee',
//   },
// };

const prevHashes = {
  ...(lsData && lsData.prevHashes || {}),
};

const outdated = {
  ...(lsData && lsData.outdated || {}),
};

// const getListings = {};

// const getListing = hash => {
//   let request;
//   let requestors = [];

//   if (getListings[hash]) {
//     request = getListings[hash].request;
//     requestors = getListings[hash].requestors;
//   } else {
//     request = $.get(Listing.getIpfsUrl(hash));

//     getListings[hash] = {
//       request,
//       requestors,
//     };

//     request._getRequest = id => {
//       requestors.push(id);
//       request.abort = () => {
//         requestors.splice(requestors.indexOf(id), 1);
//         if (!requestors.length) request.abort();
//       };
//       return request;
//     };
//   }

//   return request._getRequest(_.uniqueId());
// };

export function outdateHash(oldHash, newHash, newData) {
  // new Data optional object with listing data

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
    changed = true;
    events.trigger('newHash', {
      oldHash,
      newHash,
    });
  }

  const oldHashPrevHashes = prevHashes[oldHash];

  (oldHashPrevHashes || [])
    .push(newHash)
    .forEach(prevHash => {
      if (prevHash !== newHash) {
        outdated[prevHash] = newHash;
        changed = true;
        events.trigger('newHash', {
          oldHash: prevHash,
          newHash,
          // getListing: () => getListing(newHash),
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
