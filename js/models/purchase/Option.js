import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      value: '',
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
      addError('name', 'The option must have a name');
    }

    if (!attrs.value || attrs.value === 'undefined') {
      // this error should never normally appear to the user
      addError('value', 'The option must have a value');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
