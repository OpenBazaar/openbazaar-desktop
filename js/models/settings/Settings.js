import _ from 'underscore';
import app from '../../app';
import BaseModel from '../BaseModel';
import ShippingAddresses from '../../collections/ShippingAddresses';
import SMTPSettings from './SMTPSettings';

export default class extends BaseModel {
  defaults() {
    return {
      paymentDataInQR: false,
      showNotifications: true,
      showNsfw: false,
      localCurrency: 'USD',
      country: 'UNITED_STATES',
      termsAndConditions: '',
      refundPolicy: '',
      blockedNodes: [],
      storeModerators: [],
      shippingAddresses: new ShippingAddresses(),
      smtpSettings: new SMTPSettings(),
    };
  }

  url() {
    return app.getServerUrl('ob/settings/');
  }

  nested() {
    return {
      shippingAddresses: ShippingAddresses,
      smtpSettings: SMTPSettings,
    };
  }

  ownMod(guid) {
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    return this.get('storeModerators').indexOf(guid) !== -1;
  }

  get prettyServerVer() {
    const sVer = this.get('version');
    return sVer.substring(sVer.lastIndexOf(':') + 1, sVer.lastIndexOf('/'));
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!_.isArray(attrs.storeModerators)) {
      // this error should never be visible to the user
      addError('storeModerators', 'The storeModerators is invalid because it is not an array');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    if (method === 'create' && typeof options.type === 'undefined') {
      // we will use PUT unless you explicitly save with POST,
      // e.g. model.save({}, { type: 'POST' })
      options.type = 'PUT';
    }

    return super.sync(method, model, options);
  }

  parse(response = {}) {
    if (Array.isArray(response.blockedNodes)) {
      // de-dupe
      response.blockedNodes = Array.from(new Set(response.blockedNodes));

      // do not allow own node to be in the blocked list
      response.blockedNodes = response.blockedNodes
        .filter(peerId => peerId !== app.profile.id);
    }

    return response;
  }
}
