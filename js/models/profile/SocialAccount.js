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

    if (is.not.string(attrs.type) || !attrs.type.length) {
      addError('type', app.polyglot.t('socialAccountModelErrors.provideType'));
    }

    if (this.collection) {
      const duplicateModels = this.collection.where({ type: attrs.type, username: attrs.username });

      // If the model is not blank, make sure there are no duplicates
      if (attrs.type && attrs.username &&
        duplicateModels.length > 1 && duplicateModels[0] !== this) {
        addError('duplicate', app.polyglot.t('contactModelErrors.duplicateSocialAccount'));
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
