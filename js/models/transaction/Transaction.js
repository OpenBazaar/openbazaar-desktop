// used for sales, purchases
import { curDefToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderId';
  }

  parse(response = {}) {
    return {
      ...response,
      total: curDefToDecimal(response.total),
    };
  }
}
