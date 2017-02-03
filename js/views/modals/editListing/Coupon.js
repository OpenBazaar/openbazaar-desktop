// import $ from 'jquery';
import { formatPrice } from '../../../utils/currency';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
// import app from '../../../app';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (typeof options.getCurrency !== 'function') {
      throw new Error('Please provide a function for me to obtain the current currency.');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'coupon flexRow gutterH';
  }

  events() {
    return {
      'click .js-btnRemoveCoupon': 'onClickRemove',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  render() {
    loadTemplate('modals/editListing/coupon.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        getCurrency: this.options.getCurrency,
        formatPrice,
      }));

      this.$('select[name=discountType]').select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });

      // this._$headline = null;
    });

    return this;
  }
}
