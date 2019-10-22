import { curDefToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'txid';
  }

  parse(response = {}) {
    console.log('test me bad data');
    return {
      ...response,
      bigValue: curDefToDecimal({
        amount: response.bigValue,
        currency: response.currency,
      }),
    };
  }
}
