import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      service: '',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name || attrs.name === 'undefined') {
      // this error should never normally appear to the user
      addError('name', 'The shipping must have a name');
    }

    if (!attrs.service || attrs.service === 'undefined') {
      // this error should never normally appear to the user
      addError('service', 'The shipping must have a service');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
