import app from '../../app';
import BaseModel from '../BaseModel';
import ListingInner from './ListingInner';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.guid = options.guid;
  }

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
      if (!this.guid) {
        throw new Error('In order to fetch a listing, a guid must be set on the model instance.');
      }

      const slug = this.get('slug');

      if (!slug) {
        throw new Error('In order to fetch a listing, a slug must be set as a model attribute.');
      }

      options.url = app.getServerUrl(`ipns/${this.guid}/listings/${slug}/listing.json`);
    } else {
      options.url = app.getServerUrl('ob/listing/');
    }

    return super.sync(method, model, options);
  }
}
