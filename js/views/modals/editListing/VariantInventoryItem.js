import $ from 'jquery';
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
      'focus .js-quantity': 'onFocusQuantity',
      'keyup .js-quantity': 'onKeyupQuantity',
      'change .js-infiniteInventoryCheckbox': 'onChangeInfiniteCheckbox',
    };
  }

  get infiniteQuantityChar() {
    return '—';
  }

  onKeyupSurcharge(e) {
    this.$totalPrice.text(this.calculateTotalPrice(e.target.value));
  }

  onFocusQuantity(e) {
    if (e.target.value === this.infiniteQuantityChar) {
      e.target.setSelectionRange(0, e.target.value.length);
    }
  }

  onKeyupQuantity(e) {
    if (e.target.value !== this.infiniteQuantityChar) {
      this.$infiniteInventoryCheckbox.prop('checked', false);
    } else {
      this.$infiniteInventoryCheckbox.prop('checked', true);
    }
  }

  onChangeInfiniteCheckbox(e) {
    if ($(e.target).is(':checked')) {
      this.$quantity.val(this.infiniteQuantityChar);
    } else {
      this.$quantity.val('');
    }
  }

  getFormData(fields = this.$formFields) {
    const formData = super.getFormData(fields);
    return formData;
  }

  // Sets the model based on the current data in the UI.
  setModelData() {
    const formData = this.getFormData();

    if (formData.infiniteInventory) {
      delete formData.quantity;
      this.model.unset('quantity');
    }

    this.model.set(formData);
  }

  calculateTotalPrice(surcharge) {
    const listingPrice = this.options.getPrice();

    let formatted;

    try {
      formatted = formatCurrency(
        listingPrice.plus(surcharge), this.options.getCurrency()
      );
    } catch (e) {
      return '';
    }

    return formatted;
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

  get $infiniteInventoryCheckbox() {
    return this._$infiniteInventoryCheckbox ||
      (this._$infiniteInventoryCheckbox =
        this.$('.js-infiniteInventoryCheckbox'));
  }

  get $quantity() {
    return this._$quantity ||
      (this._$quantity =
        this.$('.js-quantity'));
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
        cid: this.cid,
        infiniteQuantityChar: this.infiniteQuantityChar,
        max: this.model.max,
      }));

      this._$formFields = null;
      this._$totalPrice = null;
      this._$infiniteInventoryCheckbox = null;
      this._$quantity = null;
    });

    return this;
  }
}
