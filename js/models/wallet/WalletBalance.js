import { integerToDecimal } from '../../utils/currency';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('wallet/balance/');
  }

  parse(response) {
    // Convert satoshi to BTC
    return {
      confirmed: integerToDecimal(response.confirmed, true),
      unconfirmed: integerToDecimal(response.unconfirmed, true),
    };
  }
}
