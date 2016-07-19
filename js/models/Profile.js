import { Model } from 'backbone';
import app from '../app';
// import is from 'is_js';

export default class extends Model {
  // constructor(options = {}) {
  //   super({
  //     idAttribute: 'guid',
  //     ...options,
  //   });
  // }

  // defaults() {
  //   return {
  //     sugar: 'snap peas',
  //   };
  // }

  // validate(attrs) {
  //   const errObj = {};
  //   const addError = (fieldName, error) => {
  //     errObj[fieldName] = errObj[fieldName] || [];
  //     errObj[fieldName].push(error);
  //   };

  //   if (attrs.mac_style_win_controls && is.not.boolean(attrs.mac_style_win_controls)) {
  //     addError('mac_style_win_controls', 'Please provide a boolean value.');
  //   }

  //   if (Object.keys(errObj).length && errObj) return errObj;

  //   return undefined;
  // }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  sync(method, model, options) {
    console.log(`the method-man is ${method}`);

    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    if (method === 'read') {
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
