import BaseModel from './BaseModel';
import app from '../app';
import ShippingAddresses from '../collections/ShippingAddresses';
import SMTPSettings from '../models/SMTPSettings';

export default class extends BaseModel {
  defaults() {
    return {
      // todo: update the attrs once server removes
      // capitalization.
      PaymentDataInQR: false,
      ShowNotifications: true,
      ShowNsfw: true,
      LocalCurrency: 'USD',
      Country: 'UNITED_STATES',
      Language: 'en-US',
      TermsAndConditions: '',
      RefundPolicy: '',
      BlockedNodes: [],
      StoreModerators: [],
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
