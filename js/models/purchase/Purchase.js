import { integerToDecimal } from '../../utils/currency';
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

  parse(response = {}) {
    let returnVal = { ...response };

    returnVal = {
      ...returnVal,
      // Convert satoshi to BTC
      amount: integerToDecimal(returnVal.amount, true),
    };

    return returnVal;
  }
}
