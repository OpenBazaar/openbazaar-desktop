import { curDefToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'txid';
  }

  parse(response = {}) {
    console.log('temp pending ob-go/#1803');
    if (response.bigValue.startsWith('--')) {
      response.bigValue = response.bigValue.slice(1);
    }

    return {
      ...response,
      bigValue: curDefToDecimal({
        amount: response.bigValue,
        currency: response.currency,
      }),
    };
  }
}
