import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import 'select2';
import getTranslatedCountries from '../../../data/countries';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: false,
      ...options,
    };

    super(opts);
    this.options = opts;

    this.select2CountryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));
  }

  events() {
    return {
      'change #shippingDestinations': 'setShippingDestination',
      ...super.events(),
    };
  }

  setShippingDestination(e) {
    console.log(e);
    console.log(this.$(e.target).val());
  }

  render() {
    loadTemplate('modals/listingDetail/shipping.html', t => {
      this.$el.html(t({
        ...this.model.get('listing').toJSON(),
        shipsFromCountry: app.settings.get('country'),
      }));

      super.render();

      const shippingDest = this.$('#shippingDestinations');

      shippingDest.select2({
        data: this.select2CountryData,
        placeholder: app.polyglot.t('listingDetail.shipToPlaceholder'),
      });

      shippingDest.val(app.settings.get('country')).trigger('change');
    });

    return this;
  }
}
