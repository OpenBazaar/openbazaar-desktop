import { Model } from 'backbone';
import _ from 'underscore';

export default class extends Model {
  defaults() {
    return {
      type: 'msg',
      duration: 2500,
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (['msg', 'warning', 'confirmed', 'pending'].indexOf(attrs.type) === -1) {
      addError('type', 'Type must be \'msg\', \'warning\', \'confirmed\', or \'pending\'');
    }

    if (!_.isNumber(attrs.duration)) {
      addError('duration', 'Duration must be a number');
    }

    if (!_.isString(attrs.msg)) {
      addError('msg', 'Msg is required and must be a string.');
    }

    if (Object.keys(errObj).length && errObj) return errObj;

    return undefined;
  }
}
