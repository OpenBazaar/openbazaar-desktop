import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Service from '../../../js/models/listing/Service';

describe('the Service model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if a name is not provided as a string', () => {
    const service = new Service();

    service.unset('name');
    service.isValid();

    let valErr = service.validationError;
    expect(valErr && valErr.name && !!valErr.name.length || false).to.equal(true);

    service.set({ name: 99 }, { validate: true });

    valErr = service.validationError;
    expect(valErr && valErr.name && !!valErr.name.length || false).to.equal(true);
  });

  it('fails validation if an estimated delivery is not provided as a string', () => {
    const service = new Service();

    service.unset('estimatedDelivery');
    service.isValid();

    let valErr = service.validationError;
    expect(valErr && valErr.estimatedDelivery && !!valErr.estimatedDelivery.length || false)
      .to.equal(true);

    service.set({ estimatedDelivery: 99 }, { validate: true });

    valErr = service.validationError;
    expect(valErr && valErr.estimatedDelivery && !!valErr.estimatedDelivery.length || false)
      .to.equal(true);
  });
});
