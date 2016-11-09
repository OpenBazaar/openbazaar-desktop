import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  get idAttribute() {
    return '_clientID';
  }

  static get maxFilenameLength() {
    return 255;
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.filename) {
      addError('filename', 'Please provide an image filename.');
    } else if (is.not.string(attrs.filename)) {
      addError('filename', 'Please provide an image filename as a string.');
    } else if (attrs.filename.length > this.constructor.maxFilenameLength) {
      addError('filename', `The filename exceeds the max length of ${this.maxFilenameLength}`);
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
