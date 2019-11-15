import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response = {}) {
    const converted = { ...response };
    this.balanceConversionErrs = this.balanceConversionErrs || {};

    converted.confirmed = integerToDecimal(
      response.confirmed,
      response.currency.divisibility
    );

    converted.unconfirmed = integerToDecimal(
      response.unconfirmed,
      response.currency.divisibility
    );

    delete converted.currency;

    return converted;
  }
}
