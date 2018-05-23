import app from '../../../app';
import BaseModel from '../../BaseModel';
import PhysicalDelivery from './PhysicalDelivery';
import DigitalDelivery from './DigitalDelivery';
import CryptoDelivery from './CryptoDelivery';

function defaults(attrs = {}, context = {}) {
  if (context.contractType === 'DIGITAL_GOOD') {
    attrs.digitalDelivery = new DigitalDelivery(attrs.digitalDelivery || {});
  } else if (context.contractType === 'CRYPTOCURRENCY') {
    attrs.cryptocurrencyDelivery = new CryptoDelivery(attrs.cryptocurrencyDelivery || {});
  } else if (context.contractType === 'PHYSICAL_GOOD' && !context.isLocalPickup) {
    attrs.physicalDelivery = new PhysicalDelivery(attrs.physicalDelivery || {});
  }

  return attrs;
}

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    if (!options.contractType) {
      throw new Error('Please provide the contract type.');
    }

    if (typeof options.isLocalPickup !== 'boolean') {
      throw new Error('Please provide a boolean indicating whether the item is to ' +
        'be picked up locally.');
    }

    super(defaults(attrs, options), options);
    this.contractType = options.contractType;
    this.isLocalPickup = options.isLocalPickup;
  }

  defaults() {
    return defaults({}, this);
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
      cryptocurrencyDelivery: CryptoDelivery,
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

      // The server is expecting an array for the <type>Delivery object in
      // order to support multiple listings. Since the client and design aren't
      // supporting that at this time, we'll convert to an array here. Once we
      // support it, the nested models should be changed to nested collections.
      if (options.attrs.physicalDelivery) {
        options.attrs.physicalDelivery = [options.attrs.physicalDelivery];
      }

      if (options.attrs.digitalDelivery) {
        options.attrs.digitalDelivery = [options.attrs.digitalDelivery];
      }

      if (options.attrs.cryptocurrencyDelivery) {
        options.attrs.cryptocurrencyDelivery = [options.attrs.cryptocurrencyDelivery];
      }
    }

    return super.sync(method, model, options);
  }
}
