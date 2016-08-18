import app from '../app';
import BaseModel from './BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  // nested() {
  //   return {
  //     social: SocialAccounts,
  //   };
  // }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', 'who do you think your are?');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    // options.attrs = options.attrs || model.toJSON(options);
    // delete options.attrs.id;

    // ensure certain fields that shouldn't be updated don't go
    // to the server
    // if (method !== 'read') {
    //   delete options.attrs.followerCount;
    //   delete options.attrs.followingCount;
    //   delete options.attrs.listingCount;
    //   delete options.attrs.lastModified;
    // }

    if (method === 'read') {
      // options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
