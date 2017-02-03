// import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
// import app from '../../../app';
import BaseView from '../../baseVw';
import Coupon from './Coupon';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a collection.');
    }

    super(options);
    this.options = options;
    this.couponViews = [];
  }

  className() {
    return 'flexRow gutterH';
  }

  events() {
    return {
      // 'click .js-removeShippingOption': 'onClickRemoveShippingOption',
      // 'click .js-btnAddService': 'onClickAddService',
      // 'click .js-clearAllShipDest': 'onClickClearShipDest',
    };
  }

  // tagName() {
  //   return 'section';
  // }

  render() {
    loadTemplate('modals/editListing/coupons.html', t => {
      // this.$el.html(t({
      //   ...this.collection.toJSON(),
      // }));

      this.$el.html(t());

      this.couponViews.forEach(coupon => coupon.remove());
      this.couponViews = [];
      const couponsFrag = document.createDocumentFragment();

      this.collection.forEach(coupon => {
        const view = this.createChild(Coupon, {
          model: coupon,
          getCurrency: () => ('USD'),
        });

        this.couponViews.push(view);
        view.render().$el.appendTo(couponsFrag);
      });

      this.$('.js-couponsWrap').append(couponsFrag);

      // this._$headline = null;
    });

    return this;
  }
}
