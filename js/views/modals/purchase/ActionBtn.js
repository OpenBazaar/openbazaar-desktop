import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import baseView from '../../baseVw';
import Listing from '../../../models/listing/Listing';

export default class extends baseView {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model.');
    }
    if (!options.state) {
      throw new Error('Please provide a state object.');
    }

    super(options);
    this.options = options;
    this.state = options.state;

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'actionBtn';
  }

  events() {
    return {
      'click .js-payBtn': 'clickPayBtn',
      'click .js-confirmPayConfirm': 'clickConfirmBtn',
      'click .js-confirmPayCancel': 'closeConfirmPay',
      'click .js-closeBtn': 'clickCloseBtn',
    };
  }

  onDocumentClick(e) {
    if (this.state.phase === 'confirm' && !($.contains(this.$confirmPay[0], e.target))) {
      this.state.phase = 'pay';
      this.render();
    }
  }

  clickPayBtn(e) {
    e.stopPropagation();
    this.state.phase = 'confirm';
    this.render();
  }

  clickConfirmBtn() {
    this.state.phase = 'pay';
    this.$payBtn.addClass('processing');
    this.$confirmPay.addClass('hide');
    this.trigger('purchase');
  }

  closeConfirmPay() {
    this.state.phase = 'pay';
    this.render();
  }

  clickCloseBtn() {
    this.trigger('close');
  }

  get $payBtn() {
    return this._$payBtn ||
      (this._$payBtn = this.$('.js-payBtn'));
  }

  get $confirmPay() {
    return this._$confirmPay ||
      (this._$confirmPay = this.$('.js-confirmPay'));
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    loadTemplate('modals/purchase/actionBtn.html', t => {
      this.$el.html(t({
        phase: this.state.phase,
        listing: this.options.listing,
      }));

      this._$payBtn = null;
      this._$confirmPay = null;
    });

    return this;
  }
}
