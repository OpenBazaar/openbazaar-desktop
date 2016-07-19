import { Model } from 'backbone';
import app from '../app';
// import is from 'is_js';

export default class extends Model {
  // defaults() {
  //   return {
  //     mac_style_win_controls: remote.process.platform === 'darwin',
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
    if (method === 'read') {
      // options.url = `${window.baseApiUrl}/ipns/${model.id}/profile`;
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else if (method === 'update') {
      // options.url = `${window.baseApiUrl}/profile/${model.id}`;
      options.url = app.getServerUrl(`ob/profile/${model.id}`);
    }

    return super.sync(method, model, options);
  }
}
