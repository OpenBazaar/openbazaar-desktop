import moment from 'moment';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      subject: '',
      message: '',
      read: false,
      outgoing: true,
    };
  }

  get idAttribute() {
    return 'messageId';
  }

  static get max() {
    return {
      subjectLength: 500,
      messageLength: 20000,
    };
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

    const max = this.constructor.max;

    if (!attrs.peerId) {
      addError('peerId', 'The peerId is required');
    }

    if (attrs.subject.length > max.subjectLength) {
      addError('subject', `The subject exceeds the max length of ${max.subjectLength}`);
    }

    if (attrs.message.length > max.messageLength) {
      addError('message', `The message exceeds the max length of ${max.messageLength}`);
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

