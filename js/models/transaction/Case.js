import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'caseId';
  }

  parse(response = {}) {
    let returnVal = { ...response };

    returnVal = {
      ...returnVal,
      // Convert from base units
      total: integerToDecimal(returnVal.total, returnVal.paymentCoin),
    };

    return returnVal;
  }
}
