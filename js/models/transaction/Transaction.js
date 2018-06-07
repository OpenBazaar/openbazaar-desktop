// used for sales, purchases
import { integerToDecimal } from '../../utils/currency';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'orderId';
  }

  parse(response = {}) {
    let returnVal = { ...response };

    console.log(`the total iiiiiiiiiisssss ${returnVal.total}`);

    returnVal = {
      ...returnVal,
      // Convert from base units
      total: integerToDecimal(returnVal.total,
        app.serverConfig.cryptoCurrency),
    };

    return returnVal;
  }
}
