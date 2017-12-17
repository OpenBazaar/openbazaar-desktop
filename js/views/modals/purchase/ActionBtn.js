import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import baseView from '../../baseVw';
import Listing from '../../../models/listing/Listing';

export default class extends baseView {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model.');
    }

    const opts = {
      ...options,
      initialState: {
        phase: 'pay',
        confirmOpen: false,
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;

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
    if (this.getState().confirmOpen &&
      !($.contains(this.getCachedEl('.js-confirmPay')[0], e.target))) {
      this.setState({ confirmOpen: false });
    }
  }

  clickPayBtn(e) {
    e.stopPropagation();
    this.setState({ confirmOpen: true });
  }

  clickConfirmBtn() {
    this.trigger('purchase');
  }

  closeConfirmPay() {
    this.setState({ confirmOpen: false });
  }

  clickCloseBtn() {
    this.trigger('close');
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/purchase/actionBtn.html', t => {
      this.$el.html(t({
        ...this.getState(),
        listing: this.options.listing,
      }));
    });

    return this;
  }
}
