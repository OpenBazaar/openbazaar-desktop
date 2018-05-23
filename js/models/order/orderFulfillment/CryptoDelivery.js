import app from '../../../app';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      transactionID: '',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.transactionID ||
      (typeof attrs.transactionID === 'string' && !attrs.transactionID.trim())) {
      addError('transactionID', app.polyglot.t('orderFulfillmentModelErrors.provideTransactionId'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
