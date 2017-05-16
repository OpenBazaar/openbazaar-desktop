import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      amount: 0,
      paymentAddress: '',
      vendorOnline: false,
      orderId: '',
    };
  }
}
