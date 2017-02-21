import moment from 'moment';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      subject: '',
      read: false,
      outgoing: true,
    };
  }

  get idAttribute() {
    return 'messageId';
  }

  url() {
    return app.getServerUrl('ob/chat/');
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    // Not translating, since none of these errors are expected to make it into
    // the UI.
    if (!attrs.peerId) {
      addError('peerId', 'The peerId is required');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || model.toJSON(options);

    if (method === 'create') {
      options.attrs.timestamp = moment(Date.now()).format();
    }

    return super.sync(method, model, options);
  }
}

