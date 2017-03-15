import '../../../lib/select2';
import { formatCurrency } from '../../../utils/currency';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (typeof options.getPrice !== 'function') {
      throw new Error('Please provide a getPrice function that returns the product price.');
    }

    if (typeof options.getCurrency !== 'function') {
      throw new Error('Please provide a function for me to obtain the current currency.');
    }

    super(options);
    this.options = options;
  }

  tagName() {
    return 'tr';
  }

  events() {
    return {
      'keyup .js-surcharge': 'onKeyupSurcharge',
    };
  }

  onKeyupSurcharge(e) {
    this.$totalPrice.text(this.calculateTotalPrice(Number(e.target.value)));
  }

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);
    return formData;
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();
    this.model.set(formData);
  }

  calculateTotalPrice(surcharge) {
    return (typeof surcharge === 'number' && !isNaN(surcharge) ?
      formatCurrency(this.options.getPrice() + surcharge, this.options.getCurrency()) :
      '');
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

  get $totalPrice() {
    return this._$totalPrice ||
      (this._$totalPrice =
        this.$('.js-totalPrice'));
  }

  render() {
    loadTemplate('modals/editListing/variantInventoryItem.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: {
          ...(this.model.validationError || {}),
        },
        getCurrency: this.options.getCurrency,
        getPrice: this.options.getPrice,
        calculateTotalPrice: this.calculateTotalPrice.bind(this),
      }));

      this._$formFields = null;
      this._$totalPrice = null;
    });

    return this;
  }
}
