import app from '../../../js/app';
import bigNumber from 'bignumber.js';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Collection } from 'backbone';
import Coupon from '../../../js/models/listing/Coupon';

describe('the Coupon model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the title exceeds the maximum length', () => {
    let title = '';
    const coupon = new Coupon();

    for (let i = 0; i < (coupon.max.titleLength + 1); i++) {
      title += 'a';
    }

    coupon.set({ title }, { validate: true });
    const valErr = coupon.validationError;

    expect(valErr && valErr.title && !!valErr.title.length || false).to.equal(true);
  });

  it('fails validation if a discount code is not provided', () => {
    const coupon = new Coupon();

    coupon.unset('discountCode');
    const valErr = coupon.validate(coupon.toJSON());

    expect(valErr && valErr.discountCode && !!valErr.discountCode.length || false).to.equal(true);
  });

  it('fails validation if the discount code is not unique', () => {
    const collection = new Collection([
      new Coupon({
        discountCode: 'happy',
      }),
      new Coupon({
        discountCode: 'happy',
      }),
    ]);

    // It will not fail on the initial occurence of a discount code that is subsequentally
    // duplicate. It will fail on all after the intital one.
    let valErr = collection.at(0).validate(collection.at(0).toJSON());
    expect(valErr && valErr.discountCode && !!valErr.discountCode.length || false).to.equal(false);

    valErr = collection.at(1).validate(collection.at(1).toJSON());
    expect(valErr && valErr.discountCode && !!valErr.discountCode.length || false).to.equal(true);
  });

  it('fails validation if you don\'t provide either a price or percentage discount', () => {
    const coupon = new Coupon();

    coupon.unset('priceDiscount');
    coupon.unset('percentDiscount');
    const valErr = coupon.validate(coupon.toJSON());

    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);
  });

  it('fails validation if you provide both a price or percentage discount', () => {
    const coupon = new Coupon();

    coupon.set({
      priceDiscount: bigNumber('123'),
      percentDiscount: 25,
    }, { validate: true });
    const valErr = coupon.validationError;

    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);
  });

  it('fails validation if you provide the percentage discount as something ' +
    'other than a number', () => {
    const coupon = new Coupon();

    coupon.set({ percentDiscount: '123' }, { validate: true });
    let valErr = coupon.validationError;

    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);

    coupon.set({ percentDiscount: true }, { validate: true });
    valErr = coupon.validationError;

    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);
  });

  it('fails validation if you provide a percent discount less than or equal to zero', () => {
    const coupon = new Coupon();

    coupon.set({ percentDiscount: 0 }, { validate: true });
    let valErr = coupon.validationError;
    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);

    coupon.set({ percentDiscount: -1 }, { validate: true });
    valErr = coupon.validationError;
    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);
  });

  it('fails validation if you provide a percent discount greater than 100', () => {
    const coupon = new Coupon();

    coupon.set({ percentDiscount: 101 }, { validate: true });
    const valErr = coupon.validationError;
    expect(valErr && valErr.percentDiscount && !!valErr.percentDiscount.length || false)
      .to.equal(true);
  });
});
