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

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this._selectedOption = options.selectedOption || {};
    this.validOptions = options.validOptions || [];
  }

  className() {
    return 'shippingOptions';
  }

  events() {
    return {
      'click .js-shippingOption': 'onSelectShippingOption',
    };
  }

  get selectedOption() {
    return this._selectedOption;
  }

  set selectedOption(opts) {
    this._selectedOption = opts;
    this.trigger('shippingOptionSelected', opts);
  }

  onSelectShippingOption(e) {
    this.selectedOption = $(e.target).data();
  }

  render() {
    loadTemplate('modals/purchase/shippingOptions.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        validOptions: this.validOptions,
        selectedOption: this.selectedOption,
        displayCurrency: app.settings.get('localCurrency'),
      }));
    });

    return this;
  }
}
