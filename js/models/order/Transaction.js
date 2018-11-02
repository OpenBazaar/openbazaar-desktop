import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'txid';
  }

  parse(response = {}) {
    return {
      ...response,
      // Convert from base units
      value: integerToDecimal(response.value, response.paymentCoin),
    };
  }
}
