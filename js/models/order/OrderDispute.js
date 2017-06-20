import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
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

  sync(method, model, options) {
    if (method === 'create' || method === 'update') {
      options.type = 'POST';
    }

    return super.sync(method, model, options);
  }
}
