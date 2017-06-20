import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'txid';
  }

  parse(response = {}) {
    return {
      ...response,
      // Convert satoshi to BTC
      value: integerToDecimal(response.value, true),
    };
  }
}
