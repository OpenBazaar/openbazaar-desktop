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
      coupons: new Coupons(),
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

  get max() {
    return {
      refundPolicyLength: 10000,
      termsAndConditionsLength: 10000,
      couponCount: 30,
    };
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
      } else if (attrs.refundPolicy.length > this.max.refundPolicyLength) {
        addError('refundPolicy', app.polyglot.t('listingInnerModelErrors.returnPolicyTooLong'));
      }
    }

    if (attrs.termsAndConditions) {
      if (is.not.string(attrs.termsAndConditions)) {
        addError('termsAndConditions', 'The terms and conditions must be of type string.');
      } else if (attrs.termsAndConditions.length > this.max.termsAndConditionsLength) {
        addError('termsAndConditions',
          app.polyglot.t('listingInnerModelErrors.termsAndConditionsTooLong'));
      }
    }

    if (this.get('metadata').get('contractType') === 'PHYSICAL_GOOD' &&
      !attrs.shippingOptions.length) {
      addError('shippingOptions', app.polyglot.t('listingInnerModelErrors.provideShippingOption'));
    }

    if (attrs.coupons.length > this.max.couponCount) {
      addError('coupons', app.polyglot.t('listingInnerModelErrors.tooManyCoupons',
        { maxCouponCount: this.max.couponCount }));
    }

    errObj = this.mergeInNestedErrors(errObj);

    // Coupon price discount cannot exceed the item price.
    attrs.coupons.forEach(coupon => {
      const priceDiscount = coupon.get('priceDiscount');

      if (typeof priceDiscount !== 'undefined' && priceDiscount > attrs.item.get('price')) {
        addError(`coupons[${coupon.cid}].priceDiscount`,
          app.polyglot.t('listingInnerModelErrors.couponsPriceTooLarge'));
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
