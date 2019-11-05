import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response = {}) {
    const converted = { ...response };
    this.balanceConversionErrs = this.balanceConversionErrs || {};

    try {
      converted.confirmed = integerToDecimal(
        response.confirmed,
        response.currency.divisibility,
        { returnNaNOnError: false }
      );
    } catch (e) {
      if (
        !this.balanceConversionErrs[response.code] &&
        !this.balanceConversionErrs[response.code].confirmed
      ) {
        this.balanceConversionErrs[response.code] = {
          ...this.balanceConversionErrs[response.code],
          confirmed: true,
        };

        console.error(`Unable to convert the ${response.code} confirmed balance from base ` +
          `units: ${e.message}`);
      }
    }

    try {
      converted.unconfirmed = integerToDecimal(
        response.unconfirmed,
        response.currency.divisibility,
        { returnNaNOnError: false }
      );
    } catch (e) {
      if (
        !this.balanceConversionErrs[response.code] &&
        !this.balanceConversionErrs[response.code].unconfirmed
      ) {
        this.balanceConversionErrs[response.code] = {
          ...this.balanceConversionErrs[response.code],
          unconfirmed: true,
        };

        console.error(`Unable to convert the ${response.code} unconfirmed balance from base ` +
          `units: ${e.message}`);
      }
    }

    delete converted.currency;

    console.log('todo - test if either confirmed or unconfirmed end up as undefined due to error. What happens in the UI?');

    return converted;
  }
}
