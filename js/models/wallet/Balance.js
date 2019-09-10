import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response = {}) {
    const converted = { ...response };

          // balanceMd.set(
          //   balanceMd.parse({
          //     code: coinType,
          //     confirmed: {
          //       amount: data.confirmedBalance,
          //       currency: data.currency,
          //     },
          //     unconfirmed: {
          //       amount: data.unconfirmedBalance,
          //       currency: data.currency,
          //     },
          //   })
          // );

    try {
      converted.confirmed = integerToDecimal(
        response.confirmed,
        response.currency.divisibility,
        { returnUndefinedOnError: false }
      );
    } catch (e) {
      console.error(`Unable to convert the ${response.code} confirmed balance from base ` +
        `units: ${e.message}`);
    }

    try {
      converted.unconfirmed = integerToDecimal(
        response.unconfirmed,
        response.currency.divisibility,
        { returnUndefinedOnError: false }
      );
    } catch (e) {
      console.error(`Unable to convert the ${response.code} unconfirmed balance from base ` +
        `units: ${e.message}`);
    }

    delete converted.currency;

    console.log('todo - test if either confirmed or unconfirmed end up as undefined due to error. What happens in the UI?');

    return converted;
  }
}
