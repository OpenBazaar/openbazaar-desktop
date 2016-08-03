import BaseModel from './BaseModel';
import app from '../app';
import ShippingAddresses from '../collections/ShippingAddresses';
import SMTPSettings from '../models/SMTPSettings';

export default class extends BaseModel {
  defaults() {
    return {
      // todo: update the attrs once server removes
      // capitalization.
      paymentDataInQR: false,
      showNotifications: true,
      showNsfw: true,
      localCurrency: 'USD',
      country: 'UNITED_STATES',
      language: 'en-US',
      termsAndConditions: '',
      refundPolicy: '',
      blockedNodes: [],
      storeModerators: [],
    };
  }

  url() {
    return app.getServerUrl('ob/settings/');
  }

  nested() {
    return {
      ShippingAddresses,
      SMTPSettings,
    };
  }

  sync(method, model, options) {
    if (method === 'create' && typeof options.type === 'undefined') {
      // we will use PUT unless you explicitly save with POST,
      // e.g. model.save({}, { type: 'POST' })
      options.type = 'PUT';
    }

    return super.sync(method, model, options);
  }
}
