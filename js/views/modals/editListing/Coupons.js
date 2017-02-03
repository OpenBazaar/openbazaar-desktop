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

    this.listenTo(this.collection, 'add', (md, cl) => {
      const index = cl.indexOf(md);
      const view = this.createCouponView(md);

      console.log('one: ' + index);

      if (index) {
        console.log('three');
        window.three = this.$couponsWrap.find('> *')
          .eq(index - 1);
        this.$couponsWrap.find('> *')
          .eq(index - 1)
          .after(view.render().el);        
      } else {
        console.log('two');
        this.$couponsWrap.prepend(view.render().el);
      }

      this.couponViews.splice(index, 0, view);
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.couponViews.splice(removeOpts.index, 1)[0]).remove();
    });
  }

  className() {
    // return 'flexRow gutterH';
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

  createCouponView(model, options = {}) {
    const view = this.createChild(Coupon, {
      model,
      getCurrency: () => ('USD'),
      ...options,
    });

    return view;
  }

  render() {
    loadTemplate('modals/editListing/coupons.html', t => {
      // this.$el.html(t({
      //   ...this.collection.toJSON(),
      // }));

      this.$el.html(t());
      this.$couponsWrap = this.$('.js-couponsWrap');

      this.couponViews.forEach(coupon => coupon.remove());
      this.couponViews = [];
      const couponsFrag = document.createDocumentFragment();

      this.collection.forEach(coupon => {
        const view = this.createCouponView(coupon);
        this.couponViews.push(view);
        view.render().$el.appendTo(couponsFrag);
      });

      this.$couponsWrap.append(couponsFrag);

      // this._$headline = null;
    });

    return this;
  }
}
