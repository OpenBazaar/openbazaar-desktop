import '../../../lib/select2';
import bigNumber from 'bignumber.js';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
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
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);

    if (formData.discountType === 'FIXED') {
      const bigNumDiscount = bigNumber(formData.discountAmount);
      formData.priceDiscount = bigNumDiscount.isNaN() ?
        formData.discountAmount : bigNumDiscount;
    } else {
      // discountAmount
      const percentDiscount = Number(formData.discountAmount);

      formData.percentDiscount = formData.discountAmount && !isNaN(percentDiscount) ?
          percentDiscount : formData.discountAmount;
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
        max: this.model.max,
        errors: this.model.validationError || {},
      }));

      this.getCachedEl('select[name=discountType]')
        .select2({
          // disables the search box
          minimumResultsForSearch: Infinity,
        });

      this._$formFields = null;
      this._$inputDiscountAmount = null;
    });

    return this;
  }
}
