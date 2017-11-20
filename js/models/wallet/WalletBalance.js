import { integerToDecimal } from '../../utils/currency';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('wallet/balance/');
  }

  parse(response) {
    // Convert from base units
    return {
      confirmed: integerToDecimal(response.confirmed, app.serverConfig.cryptoCurrency),
      unconfirmed: integerToDecimal(response.unconfirmed, app.serverConfig.cryptoCurrency),
    };
  }
}
