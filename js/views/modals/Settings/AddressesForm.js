import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../BaseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddressesForm',
      ...options,
    });

    if (!this.model) {
      throw new Error('Please provide a model.');
    }
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  render() {
    loadTemplate('modals/settings/addressesForm.html', (t) => {
      this.$el.html(t({
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');
    });

    return this;
  }
}
