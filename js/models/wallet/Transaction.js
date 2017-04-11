import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  parse(response = {}) {
    // Convert satoshi to BTC
    return {
      value: integerToDecimal(response.value, true),
      ...response,
    };
  }
}
