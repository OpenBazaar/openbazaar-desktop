import { formatPrice } from '../../../utils/currency';
import '../../../lib/select2';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (typeof options.getCoinDiv !== 'function') {
      throw new Error('Please provide a function for me to obtain the coin divisibility.');
    }

    // any parent level errors can be passed in options.couponErrors, e.g.
    // options.couponErrors = {
    //   <field-name>: ['err1', 'err2', 'err3']
    // }
    delete options.couponErrors;

    super(options);
    this.options = options;
  }

  className() {
    return 'coupon flexRow gutterH';
  }

  events() {
    return {
      'click .js-btnRemoveCoupon': 'onClickRemove',
      // 'change [name=discountType]': 'onChangeDiscountType',
      // 'change [name=discountAmount]': 'onChangeDiscountAmount',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  // onChangeDiscountType(e) {
  //   this.formatDiscountAmount(e.target.value, undefined);
  // }

  // onChangeDiscountAmount(e) {
  //   this.formatDiscountAmount(undefined, Number(e.target.value));
  // }

  // formatDiscountAmount(
  //   discountType = this.getCachedEl('select[name=discountType]').val(),
  //   val = Number(this.$inputDiscountAmount.val())
  // ) {
  //   if (discountType === 'FIXED') {
  //     this.$inputDiscountAmount.val(
  //       formatPrice(Number(val), this.options.getCoinDiv())
  //     );
  //   } else {
  //     this.$inputDiscountAmount.val(
  //       formatPrice(val, 2)
  //     );
  //   }
  // }

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
        max: this.model.max,
        errors: {
          ...(this.model.validationError || {}),
          ...(this.options.couponErrors || {}),
        },
        getCoinDiv: this.options.getCoinDiv,
        // formatPrice,
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
