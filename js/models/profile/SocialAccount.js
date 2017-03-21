import app from '../../app';
import is from 'is_js';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      type: 'facebook',
      username: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  get socialTypes() {
    return [
      'facebook',
      'twitter',
      'instagram',
      'other',
    ];
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
    } else if (this.socialTypes.indexOf(attrs.type) === -1) {
      addError('type', 'Type must be one of the required types.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
