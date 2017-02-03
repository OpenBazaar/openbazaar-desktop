import app from '../../app';
import BaseModel from '../BaseModel';
import Item from './Item';
import Metadata from './Metadata';
import ShippingOptions from '../../collections/ShippingOptions.js';
import Coupons from '../../collections/Coupons.js';
import is from 'is_js';

export default class extends BaseModel {
  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  defaults() {
    return {
      termsAndConditions: '',
      refundPolicy: '',
      item: new Item(),
      metadata: new Metadata(),
      shippingOptions: new ShippingOptions(),
    };
  }

  get nested() {
    return {
      item: Item,
      metadata: Metadata,
      shippingOptions: ShippingOptions,
      coupons: Coupons,
    };
  }

  get refundPolicyMaxLength() {
    return 10000;
  }

  get termsAndConditionsMaxLength() {
    return 10000;
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.refundPolicy) {
      if (is.not.string(attrs.refundPolicy)) {
        addError('refundPolicy', 'The return policy must be of type string.');
      } else if (attrs.refundPolicy.length > this.refundPolicyMaxLength) {
        addError('refundPolicy', app.polyglot.t('listingInnerModelErrors.returnPolicyTooLong'));
      }
    }

    if (attrs.termsAndConditions) {
      if (is.not.string(attrs.termsAndConditions)) {
        addError('termsAndConditions', 'The terms and conditions must be of type string.');
      } else if (attrs.termsAndConditions.length > this.termsAndConditionsMaxLength) {
        addError('termsAndConditions',
          app.polyglot.t('listingInnerModelErrors.termsAndConditionsTooLong'));
      }
    }

    if (this.get('metadata').get('contractType') === 'PHYSICAL_GOOD' &&
      !attrs.shippingOptions.length) {
      addError('shippingOptions', app.polyglot.t('listingInnerModelErrors.provideShippingOption'));
    }

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
