import { formatPrice } from '../../../utils/currency';
import '../../../lib/select2';
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

  // className() {
  //   return 'tr';
  // }

  tagName() {
    return 'tr';
  }

  // events() {
  //   return {
  //     'click .js-btnRemoveCoupon': 'onClickRemove',
  //     'change [name=discountType]': 'onChangeDiscountType',
  //   };
  // }

  // onClickRemove() {
  //   this.trigger('remove-click', { view: this });
  // }

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);
    return formData;
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();
    this.model.set(formData);
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

  render() {
    loadTemplate('modals/editListing/variantInventoryItem.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: {
          ...(this.model.validationError || {}),
          // ...(this.options.couponErrors || {}),
        },
        getCurrency: this.options.getCurrency,
        getPrice: this.options.getPrice,
        formatPrice,
      }));

      this._$formFields = null;
    });

    return this;
  }
}
