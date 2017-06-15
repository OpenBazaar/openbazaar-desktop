import $ from 'jquery';
import app from '../../../app';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import baseView from '../../baseVw';
import Listing from '../../../models/listing/Listing';

export default class extends baseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this._countryCode = options.countryCode || '';

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }
  }

  className() {
    return 'shippingOptions';
  }

  events() {
    return {
      'click .js-shippingOption': 'changeShippingOption',
    };
  }

  changeShippingOption(e) {
    const option = $(e.target);
    const sOpts = {};
    sOpts.name = option.attr('data-name');
    if (option.attr('data-type') !== 'LOCAL_PICKUP') {
      sOpts.service = option.attr('data-service');
    }
    this.trigger('selected', sOpts);
  }

  get countryCode() {
    return this._countryCode;
  }

  set countryCode(code) {
    this._countryCode = code;
  }

  render() {
    const shippingOptions = this.model.get('shippingOptions').toJSON().filter((option) =>
    option.regions.indexOf(this.countryCode) !== -1);

    if (shippingOptions.length) {
      const sOpts = {};
      sOpts.name = shippingOptions[0].name;
      if (shippingOptions[0].type !== 'LOCAL_PICKUP') {
        sOpts.service = shippingOptions[0].service.name;
      }
      this.trigger('selected', sOpts);
    } else {
      // if no valid option is available, set it to blank
      this.trigger('selected', { name: '', service: '' });
    }

    loadTemplate('modals/purchase/shippingOptions.html', t => {
      this.$el.html(t({
        shippingOptions,
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
