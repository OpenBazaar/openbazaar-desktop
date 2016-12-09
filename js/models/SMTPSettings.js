import BaseModel from './BaseModel';
import app from '../app';
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

    // get all keys that have String values
    const stringValuedKeys = Object.keys(attrs).filter(k => typeof attrs[k] === 'string');

    // trim all string values of whitespace
    stringValuedKeys.forEach(k => { attrs[k] = attrs[k].trim(); });

    // check if they are all empty
    const everyInputEmpty = stringValuedKeys.every(k => attrs[k].length === 0);

    if (everyInputEmpty) {
      if (attrs.notifications) {
        addError('notifications', app.polyglot.t('smtpModelErrors.notifications.caseOffIfEmpty'));
      }
    } else {
      if (is.not.url(attrs.serverAddress.trim())) {
        addError('serverAddress', app.polyglot.t('smtpModelErrors.serverAddress'));
      }
      if (is.empty(attrs.username.trim())) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseEmpty'));
      } else if (is.not.alphaNumeric(attrs.username.trim())) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseInvalid'));
      }
      if (is.empty(attrs.password.trim())) {
        addError('password', app.polyglot.t('smtpModelErrors.password'));
      }
      if (is.not.email(attrs.senderEmail.trim())) {
        addError('senderEmail', app.polyglot.t('smtpModelErrors.senderEmail'));
      }
      if (is.not.email(attrs.recipientEmail.trim())) {
        addError('recipientEmail', app.polyglot.t('smtpModelErrors.recipientEmail'));
      }
    }

    if (Object.keys(errObj).length) {
      return errObj;
    }

    return undefined;
  }
}
