import { integerToDecimal, getCoinDivisibility } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'code';
  }

  parse(response) {
    return {
      ...response,
      // Convert from base units - these will be set to undefined if the client doesn't
      // support the currency as a wallet currency (i.e. no entry in the cryptoCurrencies
      // data file). The wallet will list the currency, but it will be marked as
      // unsupported.

      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      // TODO: temp use of local coin div until the server provides it
      confirmed: integerToDecimal(response.confirmed, getCoinDivisibility(response.code)),
      unconfirmed: integerToDecimal(response.unconfirmed, getCoinDivisibility(response.code)),
    };
  }
}
