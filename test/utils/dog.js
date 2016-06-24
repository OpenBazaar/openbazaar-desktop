import { expect } from 'chai';
import { describe, it } from 'mocha';
import Dog from '../../js/utils/Dog';

describe('a dog', () => {
  it('is named bing bong', () => {
    const dog = new Dog('bing bong');
    expect(dog.name).to.equal('bing bong');
  });
});

