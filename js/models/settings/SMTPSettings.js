import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      notifications: false,
      serverAddress: '',
      username: '',
      password: '',
      senderEmail: '',
      recipientEmail: '',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.notifications) {
      if (is.not.url(attrs.serverAddress)) {
        addError('serverAddress', app.polyglot.t('smtpModelErrors.serverAddress'));
      }
      if (is.empty(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseEmpty'));
      } else if (/\s/.test(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.noWhitespace'));
      }
      if (is.empty(attrs.password)) {
        addError('password', app.polyglot.t('smtpModelErrors.password'));
      }
      if (is.not.email(attrs.senderEmail)) {
        addError('senderEmail', app.polyglot.t('smtpModelErrors.senderEmail'));
      }
      if (is.not.email(attrs.recipientEmail)) {
        addError('recipientEmail', app.polyglot.t('smtpModelErrors.recipientEmail'));
      }
    } else {
      if (is.not.url(attrs.serverAddress) && is.not.empty(attrs.serverAddress)) {
        addError('serverAddress', app.polyglot.t('smtpModelErrors.serverAddress'));
      }
      if (/\s/.test(attrs.username) && is.not.empty(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.noWhitespace'));
      }
      if (is.not.email(attrs.senderEmail) && is.not.empty(attrs.senderEmail)) {
        addError('senderEmail', app.polyglot.t('smtpModelErrors.senderEmail'));
      }
      if (is.not.email(attrs.recipientEmail) && is.not.empty(attrs.recipientEmail)) {
        addError('recipientEmail', app.polyglot.t('smtpModelErrors.recipientEmail'));
      }
    }

    if (Object.keys(errObj).length) {
      return errObj;
    }

    return undefined;
  }
}
