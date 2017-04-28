import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Listing from '../../../models/listing/Listing';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.countryCode = options.countryCode || '';

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }
  }

  className() {
    return 'shippingOptions';
  }

  events() {
    return {
    };
  }

  get countryCode() {
    return this._countryCode;
  }

  set countryCode(code) {
    this._countryCode = code;
  }

  render() {
    const filteredShipping = this.model.get('shippingOptions').toJSON().filter((option) =>
      option.regions.indexOf(this.countryCode) !== -1);

    loadTemplate('modals/purchase/shippingOptions.html', t => {
      this.$el.html(t({
        filteredShipping,
      }));
    });

    return this;
  }
}
