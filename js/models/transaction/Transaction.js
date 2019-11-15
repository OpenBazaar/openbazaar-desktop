// used for sales, purchases
import {
  integerToDecimal,
  getCoinDivisibility,
} from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderId';
  }

  parse(response = {}) {
    let returnVal = { ...response };

    // pending this issue, we'll get the divisibility from wallet cur def list
    // https://github.com/OpenBazaar/openbazaar-go/issues/1826

    let divisibility;

    try {
      divisibility = getCoinDivisibility(returnVal.paymentCoin);
    } catch (e) {
      // pass
    }

    returnVal = {
      ...returnVal,
      total: integerToDecimal(returnVal.total, divisibility, { fieldName: 'total' }),
    };

    return returnVal;
  }
}
