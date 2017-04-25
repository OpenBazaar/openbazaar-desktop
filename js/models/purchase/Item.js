import BaseModel from '../BaseModel';
import Options from '../../collections/purchase/Options';

export default class extends BaseModel {
  defaults() {
    return {
      listingHash: '',
      quantity: 0,
      options: new Options(),
      shipping: {
        name: '',
        service: '',
      },
      memo: '',
      coupons: [], // just the coupon codes
    };
  }

  get idAttribute() {
    return 'listingHash';
  }

  get nested() {
    return {
      options: Options,
    };
  }
}
