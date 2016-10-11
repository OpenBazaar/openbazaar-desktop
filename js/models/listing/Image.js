import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.hash) {
      addError('hash', 'Please provide an image hash.');
    } else if (is.not.string(attrs.hash)) {
      addError('hash', 'Please provide the image hash as a string.');
    }

    if (!attrs.filename) {
      addError('filename', 'Please provide an image filename.');
    } else if (is.not.string(attrs.hash)) {
      addError('filename', 'Please provide an image filename as a string.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
