import app from '../../app';
import { Model } from 'backbone';
import BaseModel from '../BaseModel';
import Item from './Item';
import Metadata from './Metadata';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      slug: 'foo-bar-baz', // for now a dummy slug
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  nested() {
    return {
      item: Item,
      metadata: Metadata,
    };
  }

  mergeInNestedModelErrors(errObj = {}) {
    let mergedErrs = errObj;

    Object.keys(this.nested() || {})
      .forEach((key) => {
        if (this.get(key) instanceof Model) {
          const nestedMd = this.get(key);
          const nestedErrs = nestedMd.validate(nestedMd.toJSON()) || {};
          const prefixedErrs = {};

          Object.keys(nestedErrs).forEach((nestedErrKey) => {
            prefixedErrs[`${key}.${nestedErrKey}`] = nestedErrs[nestedErrKey];
          });

          // mergedErrs = Object.assign({
          //   ...mergedErrs,
          //   ...Object.keys(nestedErrs).map((nestedErrKey) =>
          //     ({ [`${key}.${nestedErrKey}`]: nestedErrs[nestedErrKey] })),
          // });

          mergedErrs = {
            ...mergedErrs,
            ...prefixedErrs,
          };
        }
      });

    return mergedErrs;
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', 'who do you think your are?');
    }

    errObj = this.mergeInNestedModelErrors(errObj);

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
      options.url = app.getServerUrl(`ipfs/listings/${model.get('slug')}/`);
    } else {
      options.url = app.getServerUrl('ob/listing/');
    }

    return super.sync(method, model, options);
  }
}
