import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  // constructor(attrs = {}, options = {}) {
  //   super(attrs, options);
  // }

  defaults() {
    return {
      claim: '',
    };
  }

  url() {
    return app.getServerUrl('ob/opendispute/');
  }

  get idAttribute() {
    return 'orderId';
  }

  // validate() {
  //   const errObj = this.mergeInNestedErrors();
  //   if (Object.keys(errObj).length) return errObj;
  //   return undefined;
  // }

  sync(method, model, options) {
    if (method === 'create' || method === 'update') {
      options.type = 'POST';
    }

    return super.sync(method, model, options);
  }
}
