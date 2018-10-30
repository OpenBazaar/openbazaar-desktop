import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    if (!options.paymentCoin ||
      typeof options.paymentCoin !== 'string') {
      throw new Error('Please provide a paymentCoin.');
    }

    super(attrs, options);
    this.options = options;
  }

  get idAttribute() {
    return 'txid';
  }

  parse(response = {}, options = {}) {
    return {
      ...response,
      // Convert from base units
      value: integerToDecimal(response.value, options.paymentCoin),
    };
  }
}
