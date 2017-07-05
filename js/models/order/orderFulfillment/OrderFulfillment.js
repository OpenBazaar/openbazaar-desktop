import app from '../../../app';
import BaseModel from '../../BaseModel';
import PhysicalDelivery from './PhysicalDelivery';
import DigitalDelivery from './DigitalDelivery';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    if (!options.contractType) {
      throw new Error('Please provide the contract type.');
    }

    if (typeof options.isLocalPickup !== 'boolean') {
      throw new Error('Please provide a boolean indicating whether the item is to ' +
        'be picked up locally.');
    }

    // Since the contract type is not available on this when
    // the defaults are initially called, we need to set the
    // initial contract type dependant attributes here. We also
    // set them in defaults, so if the model is reset, they'll
    // be restored properly.
    if (options.contractType === 'DIGITAL_GOOD') {
      attrs.digitalDelivery = new DigitalDelivery(attrs.digitalDelivery || {});
    } else if (options.contractType === 'PHYSICAL_GOOD' && !options.isLocalPickup) {
      attrs.physicalDelivery = new PhysicalDelivery(attrs.physicalDelivery || {});
    }

    super(attrs, options);
    this.contractType = options.contractType;
    this.isLocalPickup = options.isLocalPickup;
  }

  defaults() {
    const defaults = {};

    if (this.contractType === 'DIGITAL_GOOD') {
      defaults.digitalDelivery = new DigitalDelivery();
    } else if (this.contractType === 'PHYSICAL_GOOD' && !this.isLocalPickup) {
      defaults.physicalDelivery = new PhysicalDelivery();
    }

    return defaults;
  }

  url() {
    return app.getServerUrl('ob/orderfulfillment/');
  }

  get idAttribute() {
    return 'orderId';
  }

  get nested() {
    return {
      physicalDelivery: PhysicalDelivery,
      digitalDelivery: DigitalDelivery,
    };
  }

  validate() {
    const errObj = this.mergeInNestedErrors();
    if (Object.keys(errObj).length) return errObj;
    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || this.toJSON();

    if (method === 'create' || method === 'update') {
      options.type = 'POST';

      // The server is expecting an array for any physicalDelivery or
      // digitalDelivery options in order to support multiple listings.
      // Since the client and design aren't supporting that at this time,
      // we'll convert to an array here. Once we support it, the nested
      // models should be changed to nested collections.
      if (options.attrs.physicalDelivery) {
        options.attrs.physicalDelivery = [options.attrs.physicalDelivery];
      }

      if (options.attrs.digitalDelivery) {
        options.attrs.digitalDelivery = [options.attrs.digitalDelivery];
      }
    }

    return super.sync(method, model, options);
  }
}
