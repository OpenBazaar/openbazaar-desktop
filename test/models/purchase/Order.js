import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Order from '../../../js/models/purchase/Order';

describe('the Purchase Order model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if it has no items.', () => {
    const order = new Order();
    order.set({}, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.items && !!valErr.items.length).to.equal(true);
  });

  it('fails validation if the order has a blank payment currency.', () => {
    const order = new Order();
    order.set({}, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.paymentCoin && !!valErr.paymentCoin.length).to.equal(true);
  });

  it('fails validation if the order has a payment currency that is not a string.', () => {
    const order = new Order();
    order.set({ paymentCoin: 42 }, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.paymentCoin && !!valErr.paymentCoin.length).to.equal(true);
  });

  it('fails validation if the order has an invalid payment currency.', () => {
    const order = new Order();
    order.set({ paymentCoin: 'randomTestCoin' }, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.paymentCoin && !!valErr.paymentCoin.length).to.equal(true);
  });

  it('fails validation if the order is shippable but has an invalid shipTo.', () => {
    const order = new Order({}, { shippable: true });
    order.set({ countryCode: 'USA' }, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.shipping && !!valErr.shipping.length).to.equal(true);
  });

  it('fails validation if the order is shippable but has an invalid country code.', () => {
    const order = new Order({}, { shippable: true });
    order.set({ shipTo: 'test' }, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.shipping && !!valErr.shipping.length).to.equal(true);
  });

  it('fails validation if the moderator is not a string value.', () => {
    const order = new Order();
    order.set({ moderator: 3 }, { validate: true });
    const valErr = order.validationError;

    expect(valErr && valErr.moderated && !!valErr.moderated.length).to.equal(true);
  });
});

