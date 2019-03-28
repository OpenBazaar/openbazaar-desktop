import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import Listing from '../../../models/listing/Listing';
import baseView from '../../baseVw';

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
        outdatedHash: false,
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;

    this.boundOnDocClick = this.documentClick.bind(this);
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
      'click .js-reloadOutdated': 'clickReloadOutdated',
    };
  }

  documentClick(e) {
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

  clickReloadOutdated() {
    this.trigger('reloadOutdated');
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    super.render();
    const state = this.getState();

    const loadPurchasErrTemplIfNeeded = (tPath, func) => {
      if (state.outdatedHash) return loadTemplate(tPath, func);
      func(null);
      return undefined;
    };

    loadPurchasErrTemplIfNeeded('modals/listingDetail/purchaseError.html', purchaseErrT => {
      loadTemplate('modals/purchase/actionBtn.html', t => {
        this.$el.html(t({
          ...state,
          listing: this.options.listing,
          purchaseErrT,
        }));
      });
    });

    return this;
  }
}
