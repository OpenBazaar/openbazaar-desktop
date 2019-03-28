import { expect } from 'chai';
import { describe, it } from 'mocha';
import { outdateHash, getNewerHash } from '../../js/utils/outdatedListingHashes';

describe('the outdatedListingHashes utility module', () => {
  it('that has a getNewerHash function which returns the provided ' +
    'hash if a newer one is not associated with it.', () => {
    const hash = 'aaaaa';
    expect(getNewerHash(hash)).to.equal(hash);
  });

  it('that has a getNewerHash function which returns a newer hash ' +
    'when the provided one has a newer one associated with it.', () => {
    const oldHash = 'aaaaa';
    const newHash = 'bbbbb';

    outdateHash(oldHash, newHash);
    expect(getNewerHash(oldHash)).to.equal(newHash);
  });

  it('will properly associate an old hash with a newer hash when it\'s new ' +
    'hash becomes outdated.', () => {
    const oldHash = 'aaaaa';
    const newHash = 'bbbbb';
    const newerHash = 'cccccc';

    outdateHash(oldHash, newHash);
    outdateHash(newHash, newerHash);
    expect(getNewerHash(oldHash)).to.equal(newerHash);
    expect(getNewerHash(newHash)).to.equal(newerHash);
  });

  it('will properly associate an old hash with a newer hash when it\'s new ' +
    'hash becomes outdated several times over.', () => {
    const oldHash = 'aaaaa';
    const newHash = 'bbbbb';
    const newerHash = 'cccccc';
    const newerNewerHash = 'ddddd';
    const newestHash = 'eeeee';

    outdateHash(oldHash, newHash);
    outdateHash(newHash, newerHash);
    outdateHash(newerHash, newerNewerHash);
    outdateHash(newerNewerHash, newestHash);

    expect(getNewerHash(oldHash)).to.equal(newestHash);
    expect(getNewerHash(newHash)).to.equal(newestHash);
    expect(getNewerHash(newerHash)).to.equal(newestHash);
    expect(getNewerHash(newerNewerHash)).to.equal(newestHash);
    expect(getNewerHash(newestHash)).to.equal(newestHash);
  });
});

// todo: write test of prune functionality and that it's being
// pruned via the outdate call when needed.
