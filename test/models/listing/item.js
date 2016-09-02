import { expect } from 'chai';
import { describe, it } from 'mocha';
import Item from '../../../js/models/listing/Item';

describe('the Item model', () => {
  it('fails validation if a title is not provided', () => {
    const item = new Item();
    item.set({}, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.title && !!valErr.title.length || false).to.equal(true);
  });

  it('fails validation if the condition is not one of the available types', () => {
    const item = new Item();
    item.set({
      condition: 'a little saucy',
    }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.condition && !!valErr.condition.length || false).to.equal(true);
  });

  it('fails validation if the description is not provided', () => {
    const item = new Item();
    item.set({}, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.description && !!valErr.description.length || false).to.equal(true);
  });

  it('fails validation if the description is not provided as a string', () => {
    const item = new Item();
    item.set({ description: 1 }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.description && !!valErr.description.length || false).to.equal(true);
  });

  // todo: spot check nested val errors
});
