// used for sales, purchases
import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderId';
  }

  parse(response = {}) {
    let returnVal = { ...response };

    returnVal = {
      ...returnVal,
      // Convert satoshi to BTC
      total: integerToDecimal(returnVal.total, true),
    };

    return returnVal;
  }
}
