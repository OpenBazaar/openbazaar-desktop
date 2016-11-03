import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import ShippingOption from '../../../js/models/listing/ShippingOption';

describe('the Shipping Option model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the type is not one of the available types', () => {
    const shipOpt = new ShippingOption();

    shipOpt.set({ type: 'FILBERT_MEATHEAD' }, { validate: true });

    const valErr = shipOpt.validationError;
    expect(valErr && valErr.type && !!valErr.type.length || false).to.equal(true);
  });

  it('fails validation if a name is not provided as a string', () => {
    const shipOpt = new ShippingOption();

    shipOpt.unset('name');
    shipOpt.isValid();

    let valErr = shipOpt.validationError;
    expect(valErr && valErr.name && !!valErr.name.length || false)
      .to.equal(true);

    shipOpt.set({ name: 99 }, { validate: true });

    valErr = shipOpt.validationError;
    expect(valErr && valErr.name && !!valErr.name.length || false)
      .to.equal(true);
  });

  it('fails validation if at least one region is not provided', () => {
    const shipOpt = new ShippingOption();

    shipOpt.unset('regions');
    shipOpt.isValid();

    let valErr = shipOpt.validationError;
    expect(valErr && valErr.regions && !!valErr.regions.length || false)
      .to.equal(true);

    shipOpt.set({ regions: [] }, { validate: true });

    valErr = shipOpt.validationError;
    expect(valErr && valErr.regions && !!valErr.regions.length || false)
      .to.equal(true);
  });

  it('fails validation if at least one service is not provided when ' +
    'the type is not "LOCAL_PICKUP"', () => {
    const shipOpt = new ShippingOption();

    // should result in validation error
    shipOpt.set({
      services: [],
      type: 'FIXED_PRICE',
    }, { validate: true });

    let valErr = shipOpt.validationError;
    expect(valErr && valErr.services && !!valErr.services.length || false)
      .to.equal(true);

    // should not result in validation error
    shipOpt.set({
      services: [],
      type: 'LOCAL_PICKUP',
    }, { validate: true });

    valErr = shipOpt.validationError;
    expect(valErr && valErr.services && !!valErr.services.length || false)
      .to.equal(false);
  });

  // todo: spot check nested validations
});
