import $ from 'jquery';
import _ from 'underscore';
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
    this._selectedOption = options.selectedOption || {};

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }
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

  get countryCode() {
    return this._countryCode;
  }

  set countryCode(code) {
    this._countryCode = code;
  }

  render() {
    const validShippingOptions = this.model.get('shippingOptions').toJSON().filter((option) =>
      option.regions.indexOf(this.countryCode) !== -1 || option.regions.indexOf('ALL') !== -1);

    const services = [];

    if (validShippingOptions.length) {
      validShippingOptions.forEach(option => {
        if (option.type === 'LOCAL_PICKUP') {
          // local pickup options need a service with a name and price
          option.services[0] = { name: app.polyglot.t('purchase.localPickup'), price: 0 };
        }
        option.services = _.sortBy(option.services, 'price');
        option.services.forEach(optionService => {
          services.push({
            ...optionService,
            name: option.name,
            service: optionService.name,
          });
        });
      });

      // The selected option is an object with just name and service, as that's what's used by the
      // purchase API. If the previously selected option is still valid, it should be reselected.
      const isSelectedValid = !!services.filter(service =>
        service.name === this.selectedOption.name &&
        service.service === this.selectedOption.service).length;

      if (!this.selectedOption || !this.selectedOption.name || !isSelectedValid) {
        this.selectedOption = {
          name: validShippingOptions[0].name,
          service: validShippingOptions[0].services[0].name,
        };
      }
    }

    loadTemplate('modals/purchase/shippingOptions.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        services,
        selectedOption: this.selectedOption,
        displayCurrency: app.settings.get('localCurrency'),
      }));
    });

    return this;
  }
}
