import app from '../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Follows from '../../js/collections/Follows';

describe('the Follows collection', () => {
  before(function () {

  });

  it('uses a local url if given the user guid and the type follow', () => {
    const folCol = new Follows(null, {
      type: 'followers',
      guid: app.profile.id,
    });

    expect(folCol.url.to.equal('ob/followers'));
  });

  it('uses a local url if given no guid and the type follow', () => {
    const folCol = new Follows(null, {
      type: 'followers',
    });

    expect(folCol.url.to.equal('ob/followers'));
  });

  it('uses a ipns url if given a non-user guid and the type follow', () => {
    const folCol = new Follows(null, {
      type: 'followers',
      guid: 'testguid',
    });

    expect(folCol.url.to.equal('ipns/testguid/followers'));
  });

  it('turns a plain guid into a model', () => {
    const folCol = new Follows(['testguid'], {
      type: 'followers',
    });

    expect(folCol.at(0).guid.to.equal('testguid'));
  });

  it('turns 3 follow objects into 3 models', () => {
    const folCol = new Follows([
      { guid: 'test1' },
      { guid: 'test2' },
      { guid: 'test3' },
    ], {
      type: 'followers',
    });

    expect(folCol.at(0).guid.to.equal('test1'));
    expect(folCol.at(1).guid.to.equal('test2'));
    expect(folCol.at(2).guid.to.equal('test3'));
  });
});
