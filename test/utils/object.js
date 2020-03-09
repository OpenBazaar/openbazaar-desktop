import { expect } from 'chai';
import { describe, it } from 'mocha';
import { removeProp } from '../../js/utils/object';

describe('the object utility module', () => {
  it('has a function to remove props by name from an object', () => {
    const obj = {
      hey: 'jude',
      dont: 'make it bad',
      take: 'a sad song and',
      make: 'it better',
      remember: {
        to: 'let her into your heart',
        then: 'you can start',
        'to make': 'it better',
        hey: 'jude, don\'t be afraid',
        you: {
          were: 'made to',
          go: 'out and get her',
          hey: 'jude jude jude jude!',
        },
      },
    };

    expect(removeProp(obj, 'hey'))
      .to
      .deep
      .equal({
        dont: 'make it bad',
        take: 'a sad song and',
        make: 'it better',
        remember: {
          to: 'let her into your heart',
          then: 'you can start',
          'to make': 'it better',
          you: {
            were: 'made to',
            go: 'out and get her',
          },
        },
      });
  });
});
