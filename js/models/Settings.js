import app from '../app';
import BaseModel from './BaseModel';
import ShippingAddresses from '../collections/ShippingAddresses';
import AppearanceSettings from './AppearanceSettings';
import TransactionSettings from './TransactionSettings';
import SMTPSettings from './SMTPSettings';

export default class extends BaseModel {
  defaults() {
    return {
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

  get nested() {
    return {
      shippingAddresses: ShippingAddresses,
      appearanceSettings: AppearanceSettings,
      transactionSettings: TransactionSettings,
      smtpSettings: SMTPSettings
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
