import { formatPrice } from '../../../utils/currency';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (typeof options.getCurrency !== 'function') {
      throw new Error('Please provide a function for me to obtain the current currency.');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'coupon flexRow gutterH';
  }

  events() {
    return {
      'click .js-btnRemoveCoupon': 'onClickRemove',
      'change [name=discountType]': 'onChangeDiscountType',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  onChangeDiscountType(e) {
    // Price fields are formatted on 'change' by the parent view, so we'll
    // make sure to give the appropriate class if the user is providing
    // a fixed amount for the discount amount.
    if (e.target.value === 'FIXED') {
      this.$inputDiscountAmount.addClass('js-price');
    } else {
      this.$inputDiscountAmount.removeClass('js-price');
    }
  }

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);

    if (formData.discountType === 'FIXED') {
      formData.priceDiscount = formData.discountAmount;
    } else {
      formData.percentDiscount = formData.discountAmount;
    }

    delete formData.discountType;
    delete formData.discountAmount;

    return formData;
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();

    if (formData.priceDiscount !== undefined) {
      this.model.unset('percentDiscount');
    } else {
      this.model.unset('priceDiscount');
    }

    this.model.set(formData);
  }

  get $inputDiscountAmount() {
    return this._$inputDiscountAmount ||
      (this._$inputDiscountAmount =
        this.$('input[name=discountAmount]'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields =
        this.$('select[name], input[name], textarea[name]'));
  }

  render() {
    loadTemplate('modals/editListing/coupon.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        getCurrency: this.options.getCurrency,
        formatPrice,
      }));

      this.$('select[name=discountType]').select2({
        // disables the search box
        minimumResultsForSearch: Infinity,
      });

      this._$formFields = null;
      this._$inputDiscountAmount = null;
    });

    return this;
  }
}
