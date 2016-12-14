import BaseModel from './BaseModel';

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

    if (attrs.notifications) {
      if (is.not.url(attrs.serverAddress)) {
        addError('serverAddress', app.polyglot.t('smtpModelErrors.serverAddress'));
      }
      if (is.empty(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseEmpty'));
      } else if (is.not.alphaNumeric(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseInvalid'));
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
      if (is.not.alphaNumeric(attrs.username) && is.not.empty(attrs.username)) {
        addError('username', app.polyglot.t('smtpModelErrors.username.caseInvalid'));
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
