import loadTemplate from '../../../utils/loadTemplate';
import CouponMd from '../../../models/listing/Coupon';
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

      if (index) {
        this.$couponsWrap.find('> *')
          .eq(index - 1)
          .after(view.render().el);
      } else {
        this.$couponsWrap.prepend(view.render().el);
      }

      this.couponViews.splice(index, 0, view);
    });

    this.listenTo(this.collection, 'remove', (md, cl, removeOpts) => {
      (this.couponViews.splice(removeOpts.index, 1)[0]).remove();
    });
  }

  events() {
    return {
      'click .js-addCoupon': 'onClickAddCoupon',
    };
  }

  onClickAddCoupon() {
    this.collection.add(new CouponMd());
  }

  setCollectionData() {
    this.couponViews.forEach(coupon => coupon.setModelData());
  }

  createCouponView(model, options = {}) {
    const view = this.createChild(Coupon, {
      model,
      getCurrency: () => ('USD'),
      ...options,
    });

    this.listenTo(view, 'remove-click', e =>
      this.collection.remove(e.view.model));

    return view;
  }

  render() {
    loadTemplate('modals/editListing/coupons.html', t => {
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
