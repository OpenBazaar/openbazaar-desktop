import loadTemplate from '../../../utils/loadTemplate';
import CouponMd from '../../../models/listing/Coupon';
import BaseView from '../../baseVw';
import Coupon from './Coupon';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a collection.');
    }

    if (typeof options.maxCouponCount === 'undefined') {
      throw new Error('Please provide the maximum coupon count.');
    }

    // Certain coupon validations are not possible to do purely in the Coupon
    // model (e.g. validating the coupon price is not greater than the listing price).
    // In that case, any coupon related errors can be optionally passed in, in the
    // following format:
    // options.couponErrors = {
    //   coupons[<model.cid>].<fieldName> = ['error1', 'error2', ...],
    //   coupons[<model.cid>].<fieldName2> = ['error1', 'error2', ...],
    //   coupons[<model2.cid>].<fieldName> = ['error1', 'error2', ...]
    // }

    super(options);
    this.options = options;
    this.couponViews = [];

    this.listenTo(this.collection, 'add', (md, cl) => {
      const index = cl.indexOf(md);
      const view = this.createCouponView(md);

      if (index) {
        this.$couponsWrap.find('> *')
          .eq(index - 1)
          .after(view.render().el);
      } else {
        this.$couponsWrap.prepend(view.render().el);
      }

      this.couponViews.splice(index, 0, view);

      if (this.collection.length >= this.options.maxCouponCount) {
        this.$addCoupon.addClass('hide');
      }
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.couponViews.splice(removeOpts.index, 1)[0]).remove();

      if (this.collection.length < this.options.maxCouponCount) {
        this.$addCoupon.removeClass('hide');
      }
    });
  }

  events() {
    return {
      'click .js-addCoupon': 'onClickAddCoupon',
    };
  }

  onClickAddCoupon() {
    this.collection.add(new CouponMd());
    this.couponViews[this.couponViews.length - 1]
      .$('input[name=title]')
      .focus();
  }

  setCollectionData() {
    this.couponViews.forEach(coupon => coupon.setModelData());
  }

  createCouponView(model, options = {}) {
    const couponErrors = {};

    if (this.options.couponErrors) {
      Object.keys(this.options.couponErrors)
        .forEach(errKey => {
          if (errKey.startsWith(`coupons[${model.cid}]`)) {
            couponErrors[errKey.slice(errKey.indexOf('.') + 1)] =
              this.options.couponErrors[errKey];
          }
        });
    }

    const view = this.createChild(Coupon, {
      model,
      getCurrency: () => ('USD'),
      couponErrors,
      ...options,
    });

    this.listenTo(view, 'remove-click', e =>
      this.collection.remove(e.view.model));

    return view;
  }

  get $addCoupon() {
    return this._$addCoupon ||
      (this._$addCoupon =
        this.$('.js-addCoupon'));
  }

  render() {
    loadTemplate('modals/editListing/coupons.html', t => {
      this.$el.html(t({
        coupons: this.collection.toJSON(),
        maxCouponCount: this.options.maxCouponCount,
      }));

      this.$couponsWrap = this.$('.js-couponsWrap');
      this._$addCoupon = null;

      this.couponViews.forEach(coupon => coupon.remove());
      this.couponViews = [];
      const couponsFrag = document.createDocumentFragment();

      this.collection.forEach(coupon => {
        const view = this.createCouponView(coupon);
        this.couponViews.push(view);
        view.render().$el.appendTo(couponsFrag);
      });

      this.$couponsWrap.append(couponsFrag);
    });

    return this;
  }
}
