import $ from 'jquery';
import '../../../lib/select2';
import { short } from '../../components/value/valueConfigs';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import Value from '../../components/value/Value';

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

    if (typeof options.getListPosition !== 'function') {
      throw new Error('options.getListPosition must be provided as a function.');
    }

    super(options);
    this.options = options;
    this.renderTotalPrice = this.renderTotalPrice.bind(this);
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
    this.renderTotalPrice(Number(e.target.value));
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
      formData.quantity = -1;
    }

    this.model.set(formData);
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

  renderTotalPrice(surcharge) {
    if (this.value) this.value.remove();

    const listingPrice = this.options.getPrice();

    if (typeof listingPrice !== 'number' || isNaN(listingPrice) ||
      typeof surcharge !== 'number' && isNaN(surcharge)) {
      return;
    }

    const valueInitialState = {
      ...short({
        toCur: this.options.getCurrency(),
      }),
      amount: (listingPrice || 0) + surcharge,
      toCur: this.options.getCurrency(),
    };

    const { index, total } = this.options.getListPosition();

    if (index === total - 1 || index === total - 2) {
      // In order to not trigger a scroll bar on hover, the last two rows
      // should have the truncated value tip come on top.
      valueInitialState.tipClass =
        'arrowBoxTipCenteredTop tx6 clrP clrBr clrT';
    }

    this.value = this.createChild(Value, {
      initialState: valueInitialState,
    });

    this.getCachedEl('.js-totalPrice')
      .html(this.value.render().el);
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
        cid: this.cid,
        infiniteQuantityChar: this.infiniteQuantityChar,
        max: this.model.max,
      }));

      this._$formFields = null;
      this._$totalPrice = null;
      this._$infiniteInventoryCheckbox = null;
      this._$quantity = null;

      this.renderTotalPrice(this.model.get('surcharge'));
    });

    return this;
  }
}
