import app from '../../app';
import is from 'is_js';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      type: '',
      username: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.string(attrs.username) || !attrs.username.length) {
      addError('username', app.polyglot.t('socialAccountModelErrors.provideUsername'));
    }

    if (is.not.string(attrs.type)) {
      addError('type', 'Please provide a type.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
