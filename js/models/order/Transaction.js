import { integerToDecimal } from '../../utils/currency';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'txid';
  }

  parse(response = {}) {
    return {
      ...response,
      // Convert satoshi to BTC
      value: integerToDecimal(response.value, app.serverConfig.cryptoCurrency),
    };
  }
}
