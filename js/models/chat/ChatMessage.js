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

  get isGroupChatMessage() {
    return !!this.get('peerIds');
  }

  static get max() {
    return {
      subjectLength: 500,
      messageLength: 20000,
    };
  }

  url() {
    return app.getServerUrl(`ob/${this.isGroupChatMessage ? 'groupchat' : 'chat'}/`);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const max = this.constructor.max;

    if (!this.isGroupChatMessage) {
      if (!attrs.peerId) {
        addError('peerId', 'The peerId is required');
      }
    } else if (!Array.isArray(attrs.peerIds) || !attrs.peerIds.length) {
      addError('peerIds', 'peerIds must be provided as an array.');
    }

    if (attrs.subject !== undefined && typeof attrs.subject !== 'string') {
      addError('subject', 'If providing a subject, it must be provided as a string.');
    } else if (attrs.subject.length > max.subjectLength) {
      addError('subject', `The subject exceeds the max length of ${max.subjectLength}`);
    } else if (this.isGroupChatMessage && !attrs.subject) {
      addError('subject', 'A subject is required for a group chat message.');
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
      const timestamp = moment(Date.now()).format();
      options.attrs.timestamp = timestamp;
      this.set('timestamp', timestamp);
    }

    return super.sync(method, model, options);
  }
}

