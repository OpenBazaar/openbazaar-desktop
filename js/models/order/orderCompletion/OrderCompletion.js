import app from '../../../app';
import Ratings from '../../../collections/order/Ratings';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('ob/ordercompletion/');
  }

  get idAttribute() {
    return 'orderId';
  }

  get defaults() {
    return {
      ratings: new Ratings(),
    };
  }

  get nested() {
    return {
      ratings: Ratings,
    };
  }

  validate() {
    const errObj = this.mergeInNestedErrors();
    if (Object.keys(errObj).length) return errObj;
    return undefined;
  }
}
