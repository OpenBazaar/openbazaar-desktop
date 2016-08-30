import app from '../../app';
import BaseModel from '../BaseModel';
import ListingInner from './ListingInner';

export default class extends BaseModel {
  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  get nested() {
    return {
      listing: ListingInner,
    };
  }

  validate() {
    let errObj = {};
    // const addError = (fieldName, error) => {
    //   errObj[fieldName] = errObj[fieldName] || [];
    //   errObj[fieldName].push(error);
    // };

    errObj = this.mergeInNestedModelErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    if (method === 'read') {
      options.url = app.getServerUrl(`ipfs/listings/${model.get('slug')}/`);
    } else {
      options.url = app.getServerUrl('ob/listing/');
    }

    return super.sync(method, model, options);
  }
}
