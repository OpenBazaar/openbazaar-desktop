import app from '../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Follows from '../../js/collections/Followers';

describe('the Follows collection', () => {
  before(function () {
    app.profile = { id: '1' };
  });

  it('uses a local url if given the user guid and the type followers', () => {
    const folCol = new Follows(null, {
      type: 'followers',
      guid: app.profile.id,
    });

    expect(folCol.url()).to.equal(app.getServerUrl('ob/followers'));
  });

  it('uses a local url if given no guid and the type followers', () => {
    const folCol = new Follows(null, {
      type: 'followers',
    });

    expect(folCol.url()).to.equal(app.getServerUrl('ob/followers'));
  });

  it('uses a ipns url if given a non-user guid and the type followers', () => {
    const folCol = new Follows(null, {
      type: 'followers',
      guid: 'testguid',
    });

    expect(folCol.url()).to.equal(app.getServerUrl('ipns/testguid/followers'));
  });

  it('turns a plain guid into a model', () => {
    // const folCol = new Follows(['test1', 'test2'], { type: 'followers' });

    const folCol = new Follows(['test1', 'test2'], {
      type: 'followers',
      parse: true,
    });

    expect(folCol.at(0).get('guid')).to.equal('test1');
    expect(folCol.at(1).get('guid')).to.equal('test2');
  });

  it('turns 3 follow objects into 3 models', () => {
    const folCol = new Follows([
      { guid: 'test1' },
      { guid: 'test2' },
      { guid: 'test3' },
    ], {
      type: 'followers',
      parse: true,
    });

    expect(folCol.at(0).get('guid')).to.equal('test1');
    expect(folCol.at(1).get('guid')).to.equal('test2');
    expect(folCol.at(2).get('guid')).to.equal('test3');
  });
});
