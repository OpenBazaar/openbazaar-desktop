import app from '../../app';
import { guid } from '../../utils';
import BaseModel from '../BaseModel';
import Image from './Image';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    super({
      ...attrs,
      _clientID: attrs._clientID || guid(),
    }, options);
  }

  defaults() {
    return {
      name: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  get nested() {
    return {
      image: Image,
    };
  }

  get max() {
    return {
      nameLength: 40,
    };
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('name', app.polyglot.t('variantModelErrors.provideName'));
    } else if (attrs.name.length > this.max.nameLength) {
      addError('name', app.polyglot.t('variantModelErrors.nameTooLong', {
        name: attrs.name,
        maxLength: this.max.nameLength,
      }));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
