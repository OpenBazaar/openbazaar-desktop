import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  parse(response = {}) {
    let returnVal = response;

    if (response.transactions) {
      // this response is coming from the collection, we'll
      // do nothing and let the collection handle it.
    } else {
      returnVal = {
        // Convert satoshi to BTC
        value: integerToDecimal(response.value, true),
        ...response,
      };
    }

    return returnVal;
  }

  idAttribute() {
    return 'txid';
  }
}
