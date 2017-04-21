import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      listingHash: '',
      quantity: 0,
      options: [],
      shipping: {
        name: '',
        service: '',
      },
    };
  }

  get idAttribute() {
    return 'listingHash';
  }
}
