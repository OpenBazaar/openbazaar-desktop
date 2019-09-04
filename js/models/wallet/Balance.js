import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response = {}) {
    let confirmed;
    let unconfirmed;

    try {
      confirmed = integerToDecimal(
        response.confirmed.amount,
        response.confirmed.currency.divisibility,
        { returnUndefinedOnError: false }
      );
    } catch (e) {
      console.error(`Unable to convert the ${response.code} confirmed balance from base ` +
        `units: ${e.message}`);
    }

    try {
      unconfirmed = integerToDecimal(
        response.unconfirmed.amount,
        response.unconfirmed.currency.divisibility,
        { returnUndefinedOnError: false }
      );
    } catch (e) {
      console.error(`Unable to convert the ${response.code} unconfirmed balance from base ` +
        `units: ${e.message}`);
    }

    console.log('todo - test the scenario in the comment below.');

    return {
      ...response,
      // Convert from base units - these will be set to undefined if the client doesn't
      // support the currency as a wallet currency (i.e. no entry in the cryptoCurrencies
      // data file). The wallet will list the currency, but it will be marked as
      // unsupported.
      confirmed,
      unconfirmed,
    };
  }
}
