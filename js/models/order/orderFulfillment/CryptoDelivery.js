import app from '../../../app';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      transactionID: '',
    };
  }

  get max() {
    return {
      transactionIDLength: 512,
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

    if (attrs.transactionID.length > this.max.transactionIDLength) {
      addError('transactionID',
        app.polyglot.t('orderFulfillmentModelErrors.transactionIDTooLong',
        { maxLength: this.max.transactionIDLength }));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
