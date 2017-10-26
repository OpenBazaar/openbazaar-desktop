import loadTemplate from '../../../utils/loadTemplate';
import { getTranslatedCountries } from '../../../data/countries';
import baseVw from '../../baseVw';
import '../../../lib/select2';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddressesForm',
      ...options,
    });

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.countryList = getTranslatedCountries();
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  render() {
    loadTemplate('modals/settings/addressesForm.html', (t) => {
      this.$el.html(t({
        countryList: this.countryList,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this.$('#settingsAddressCountry').select2();
      this.$formFields = this.$('select[name], input[name], textarea[name]');
    });

    return this;
  }
}
