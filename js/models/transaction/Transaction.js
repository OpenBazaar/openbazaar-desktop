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
      // Convert from base units
      total: integerToDecimal(returnVal.total, returnVal.paymentCoin),
    };

    return returnVal;
  }
}
