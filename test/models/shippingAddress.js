import app from '../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import ShippingAddress from '../../js/models/settings/ShippingAddress';

describe('the Shipping Address model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('defaults name to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('name')).to.equal('');
  });

  it('defaults company to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('company')).to.equal('');
  });

  it('defaults addressLineOne to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('addressLineOne')).to.equal('');
  });

  it('defaults addressLineTwo to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('addressLineTwo')).to.equal('');
  });

  it('defaults state to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('state')).to.equal('');
  });

  it('defaults postalCode to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('postalCode')).to.equal('');
  });

  it('defaults addressNotes to an empty string', () => {
    const address = new ShippingAddress();

    expect(address.get('addressNotes')).to.equal('');
  });

  it('fails validation if a name is not provided', () => {
    const address = new ShippingAddress();
    address.set({}, { validate: true });
    const valErr = address.validationError;

    expect(valErr && valErr.name && !!valErr.name.length || false).to.equal(true);
  });

  it('fails validation if a country is not provided', () => {
    const address = new ShippingAddress();
    address.unset('country');
    address.set({}, { validate: true });
    const valErr = address.validationError;

    expect(valErr && valErr.country && !!valErr.country.length || false).to.equal(true);
  });
});
