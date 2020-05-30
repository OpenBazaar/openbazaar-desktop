import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response = {}) {
    const converted = { ...response };
    this.balanceConversionErrs = this.balanceConversionErrs || {};
    converted.confirmed = response.confirmed
    converted.unconfirmed = response.unconfirmed

    return converted;
  }
}
