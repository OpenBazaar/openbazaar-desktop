import app from '../../../app';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      shipper: '',
      trackingNumber: '',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.shipper || (typeof attrs.shipper === 'string' && !attrs.shipper.trim())) {
      addError('shipper', app.polyglot.t('orderFulfillmentModelErrors.provideShipper'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
