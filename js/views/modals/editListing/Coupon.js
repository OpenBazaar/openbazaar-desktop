// import $ from 'jquery';
import { formatPrice } from '../../../utils/currency';
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
    return 'flexRow gutterH';
  }

  events() {
    return {
      // 'click .js-removeShippingOption': 'onClickRemoveShippingOption',
      // 'click .js-btnAddService': 'onClickAddService',
      // 'click .js-clearAllShipDest': 'onClickClearShipDest',
    };
  }

  render() {
    loadTemplate('modals/editListing/coupons.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        getCurrency: this.options.getCurrency,
        formatPrice,
      }));

      // this._$headline = null;
    });

    return this;
  }
}
