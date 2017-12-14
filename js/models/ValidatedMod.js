import BaseModel from './BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      peerID: '',
      type: '',
    };
  }

  get idAttribute() {
    return 'peerID';
  }

  parse(response) {
    console.log(response);
    // if the response is not an object, assume it is a peerID and convert it
    const parsedResponse = (!!response) && (response.constructor === Object) ? response :
      { peerID: response };
    return parsedResponse;
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('peerID', 'peerID must be provided');
    } else if (is.not.string(attrs.peerID)) {
      addError('peerID', 'peerID must be a string.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
