import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  // defaults() {
  //   return {
  //     subject: '',
  //   };
  // }

  url() {
    return app.getServerUrl('wallet/balance/');
  }

  // validate(attrs) {
  //   const errObj = {};
  //   const addError = (fieldName, error) => {
  //     errObj[fieldName] = errObj[fieldName] || [];
  //     errObj[fieldName].push(error);
  //   };

  //   if (!attrs.peerId) {
  //     addError('peerId', 'The peerId is required');
  //   }

  //   if (Object.keys(errObj).length) return errObj;

  //   return undefined;
  // }

  // sync(method, model, options) {
  //   options.attrs = options.attrs || model.toJSON(options);

  //   if (method === 'create') {
  //     options.attrs.timestamp = moment(Date.now()).format();
  //   }

  //   return super.sync(method, model, options);
  // }
}
