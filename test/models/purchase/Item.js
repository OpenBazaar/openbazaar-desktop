import bigNumber from 'bignumber.js';
import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Item from '../../../js/models/purchase/Item';

describe('the Purchase Item model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if it is a non-crypto item and has a non-integer quantity.', () => {
    const item = new Item({}, { getCoinDiv: () => 8 });

    item.set({ quantity: 'a' }, { validate: true });
    let valErr = item.validationError;
    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);

    item.set({ quantity: '100' }, { validate: true });
    valErr = item.validationError;
    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);

    // should pass
    item.set({ quantity: bigNumber(100) }, { validate: true });
    valErr = item.validationError;
    expect(valErr && valErr.quantity && !!valErr.quantity.length || false).to.equal(false);

    item.set({ quantity: true }, { validate: true });
    valErr = item.validationError;
    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);

    item.set({ quantity: null }, { validate: true });
    valErr = item.validationError;
    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);
  });

  it('fails validation if it is a non-crypto item and has a negative quantity.', () => {
    const item = new Item({}, { getCoinDiv: () => 8 });
    item.set({ quantity: bigNumber(-1) }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);
  });

  it('fails validation if it is a non-crypto item and has a payment address.', () => {
    const item = new Item({}, { getCoinDiv: () => 8 });
    item.set({ paymentAddress: 'test' }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.paymentAddress && !!valErr.paymentAddress.length).to.equal(true);
  });

  it('fails validation if it is a crypto item and has a non-number quantity.', () => {
    const item = new Item({}, {
      isCrypto: true,
      getCoinDiv: () => 8,
      getCoinType: () => 'ZRX',
    });
    item.set({ quantity: 'a' }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);
  });

  it('fails validation if it is a crypto item and has a negative quantity.', () => {
    const item = new Item({}, {
      isCrypto: true,
      getCoinDiv: () => 8,
      getCoinType: () => 'ZRX',
    });
    item.set({ quantity: bigNumber(-1) }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.quantity && !!valErr.quantity.length).to.equal(true);
  });

  it('fails validation if it is a crypto item and is missing a paymentAddress.', () => {
    const item = new Item({}, {
      isCrypto: true,
      getCoinDiv: () => 8,
      getCoinType: () => 'ZRX',
    });
    item.set({}, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.paymentAddress && !!valErr.paymentAddress.length).to.equal(true);
  });

  it('fails validation if it is a crypto item and the paymentAddress is too long.', () => {
    const item = new Item({}, {
      isCrypto: true,
      getCoinDiv: () => 8,
      getCoinType: () => 'ZRX',
    });
    const fakeAddr = 'v1LbAxmkA0pKkDJ4xqkVYmrcrl1YcUYEGLDFBkpT7XERN7S4xF9EHo45WjWzHNoz8bv8XRdfnqg' +
      'g40C0bnQ53pXYXbsJMnj58GtctUvg0ghhjGFmc1e5iuoZ9BDrVojHXiYZBWskKPlR8wdkpmm9PTsOIAuQDaw9a5gTp' +
      'a0UXbwJ8gNmujowBzKrXjF1t8A62fZufZ1YktervBwSRyg7OhXQY9u5bHqHgvXvDow71W2p4Ud7e7JN8pJro0fM16H' +
      '0UaHK';
    item.set({ paymentAddress: fakeAddr }, { validate: true });
    const valErr = item.validationError;

    expect(valErr && valErr.paymentAddress && !!valErr.paymentAddress.length).to.equal(true);
  });
});

