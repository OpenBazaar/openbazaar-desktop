import BaseModel from './BaseModel';
import _ from 'underscore';

export default class extends BaseModel {
  defaults() {
    return {
      type: 'message',
      duration: 2500,
    };
  }

  getMessageTypes() {
    return [
      'message',
      'warning',
      'confirmed',
      'pending',
    ];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (this.getMessageTypes().indexOf(attrs.type) === -1) {
      addError('type', `Type must be one of [${this.getMessageTypes().join(', ')}]`);
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
