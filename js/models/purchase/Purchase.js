import { integerToDecimal } from '../../utils/currency';
import app from '../../app';
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
      // Convert from base units
      amount: integerToDecimal(returnVal.amount, app.serverConfig.cryptoCurrency),
    };

    return returnVal;
  }
}
