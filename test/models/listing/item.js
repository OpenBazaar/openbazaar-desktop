import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import bigNumber from 'bignumber.js';
import Item from '../../../js/models/listing/Item';

describe('the Item model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if a title is not provided', () => {
    const item = new Item();
    item.set({}, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.title && !!valErr.title.length || false).to.equal(true);
  });

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
    item.unset('description');
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

  it('fails validation if the number of tags exceeds the maximum allowable amount', () => {
    const item = new Item();
    const tags = [];

    for (let i = 0; i < (item.max.tags + 1); i++) {
      tags.push('moo');
    }

    item.set({ tags }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.tags && !!valErr.tags.length || false).to.equal(true);
  });

  it('fails validation if a price currency is not provided as an object', () => {
    const item = new Item();
    item.set({
      priceCurrency: {
        code: 'USD',
        divisibility: 2,
      },
    }, { validate: true });
    const valErr = item.validationError;
    expect(valErr && valErr.priceCurrency && !!valErr.priceCurrency.length || false)
      .to.equal(false);

    const item2 = new Item();
    item2.set({
      priceCurrency: 'howdy',
    }, { validate: true });
    const valErr2 = item2.validationError;
    expect(valErr2 && valErr2.priceCurrency && !!valErr2.priceCurrency.length || false)
      .to.equal(true);
  });

  it('fails validation if a valid price currency code is not provided', () => {
    const item = new Item();
    item.set({
      priceCurrency: {
        code: 'USD',
        divisibility: 2,
      },
    }, { validate: true });
    const valErr = item.validationError;
    expect(
      valErr &&
      valErr['priceCurrency.code'] &&
      !!valErr['priceCurrency.code'].length || false
    )
      .to.equal(false);

    const item2 = new Item();
    item2.set({
      priceCurrency: {
        code: false,
        divisibility: 2,
      },
    }, { validate: true });
    const valErr2 = item2.validationError;
    expect(
      valErr2 &&
      valErr2['priceCurrency.code'] &&
      !!valErr2['priceCurrency.code'].length || false
    )
      .to.equal(true);

    const item3 = new Item();
    item3.set({
      priceCurrency: {
        code: 'biscuits-and-gravy',
        divisibility: 2,
      },
    }, { validate: true });
    const valErr3 = item3.validationError;
    expect(
      valErr3 &&
      valErr3['priceCurrency.code'] &&
      !!valErr3['priceCurrency.code'].length || false
    )
      .to.equal(true);
  });

  it('fails validation if a valid price currency divisibility is not provided', () => {
    const item = new Item();
    item.set({
      priceCurrency: {
        code: 'USD',
        divisibility: 2,
      },
    }, { validate: true });
    const valErr = item.validationError;
    expect(
      valErr &&
      valErr['priceCurrency.divisibility'] &&
      !!valErr['priceCurrency.divisibility'].length || false
    )
      .to.equal(false);

    const item2 = new Item();
    item2.set({
      priceCurrency: {
        code: 'USD',
        divisibility: -1,
      },
    }, { validate: true });
    const valErr2 = item2.validationError;
    console.dir(valErr2);
    expect(
      valErr2 &&
      valErr2['priceCurrency.divisibility'] &&
      !!valErr2['priceCurrency.divisibility'].length || false
    )
      .to.equal(true);

    const item3 = new Item();
    item3.set({
      priceCurrency: {
        code: 'USD',
        divisibility: 'big-charlie',
      },
    }, { validate: true });
    const valErr3 = item3.validationError;
    expect(
      valErr3 &&
      valErr3['priceCurrency.divisibility'] &&
      !!valErr3['priceCurrency.divisibility'].length || false
    )
      .to.equal(true);
  });

  it('fails validation if the bigPrice is not valid', () => {
    const item = new Item();
    item.set({
      bigPrice: bigNumber(100.001),
      priceCurrency: {
        code: 'USD',
        divisibility: 2,
      },
    }, { validate: true });
    const valErr = item.validationError;
    expect(valErr && !!valErr.bigPrice.length || false)
      .to.equal(true);
  });

  // todo: spot check nested val errors
});
