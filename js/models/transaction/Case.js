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
      // TODO: temp hard code of coinDiv until the server provides it
      // TODO: temp hard code of coinDiv until the server provides it
      // TODO: temp hard code of coinDiv until the server provides it
      // TODO: temp hard code of coinDiv until the server provides it
      total: integerToDecimal(returnVal.total, 8),
    };

    return returnVal;
  }
}
