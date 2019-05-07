import $ from 'jquery';
import app from '../../../app';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import Listing from '../../../models/listing/Listing';
import baseView from '../../baseVw';
import Value from '../../components/value/Value';
import { full } from '../../components/value/valueConfigs';

export default class extends baseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this._selectedOption = options.selectedOption || {};
    this.validOptions = options.validOptions || [];
    this.priceVws = this.priceVws || [];
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
    super.render();

    const flatModel = this.model.toJSON();
    this.priceVws.forEach(priceVw => priceVw.remove());

    loadTemplate('modals/purchase/shippingOptions.html', t => {
      this.$el.html(t({
        ...flatModel,
        validOptions: this.validOptions,
        selectedOption: this.selectedOption,
      }));

      this.validOptions.forEach(service => {
        const priceVw = this.createChild(Value, {
          initialState: {
            ...full({
              fromCur: flatModel.metadata.pricingCurrency,
              toCur: app.settings.get('localCurrency'),
            }),
            fromCur: flatModel.metadata.pricingCurrency,
            toCur: app.settings.get('localCurrency'),
            amount: service.price,
          },
        });


        this.getCachedEl(`[data-client-id=${service._clientID}]`)
          .html(priceVw.render().el);

        this.priceVws.push(priceVw);
      });
    });

    return this;
  }
}
