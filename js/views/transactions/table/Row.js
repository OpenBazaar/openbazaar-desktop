/*
  This table is re-used for Sales, Purchases and Cases.
*/

import app from '../../../app';
import moment from 'moment';
import loadTemplate from '../../../utils/loadTemplate';
import { recordEvent } from '../../../utils/metrics';
import baseVw from '../../baseVw';
import CryptoTradingPair from '../../../views/components/CryptoTradingPair';

export default class extends baseVw {
  constructor(options = {}) {
    const types = ['sales', 'purchases', 'cases'];
    const opts = {
      initialState: {
        acceptOrderInProgress: false,
        rejectOrderInProgress: false,
        cancelOrderInProgress: false,
      },
      type: 'sales',
      ...options,
    };

    if (types.indexOf(opts.type) === -1) {
      throw new Error('Please provide a valid type.');
    }

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model');
    }

    this.type = opts.type;

    this.$el.toggleClass('unread', !this.model.get('read'));
    this.listenTo(this.model, 'change:read', (md, read) => {
      this.$el.toggleClass('unread', !read);
    });
    this.listenTo(this.model, 'change', md => {
      if (md.hasChanged('read') &&
        Object.keys(md.changedAttributes).length === 1) {
        // if the only thing that has changed is the read flag,
        // we'll do nothing since that has it's own handler
        return;
      }

      this.render();
    });
  }

  tagName() {
    return 'tr';
  }

  events() {
    return {
      'click .js-acceptOrder': 'onClickAcceptOrder',
      'click .js-rejectOrder': 'onClickRejectOrder',
      'click .js-cancelOrder': 'onClickCancelOrder',
      'click .js-userCol a': 'onClickUserColLink',
      'click .js-listingCol a': 'onClickListingColLink',
      click: 'onRowClick',
    };
  }

  onClickAcceptOrder(e) {
    this.trigger('clickAcceptOrder', { view: this });
    e.stopPropagation();
    recordEvent('Transactions_AcceptOrder');
  }

  onClickRejectOrder(e) {
    this.trigger('clickRejectOrder', { view: this });
    e.stopPropagation();
    recordEvent('Transactions_RejectOrder');
  }

  onClickCancelOrder(e) {
    this.trigger('clickCancelOrder', { view: this });
    e.stopPropagation();
    recordEvent('Transactions_CancelOrder');
  }

  onClickUserColLink(e) {
    e.stopPropagation();
    recordEvent('Transactions_ClickUser', {
      type: this.type,
    });
  }

  onClickListingColLink(e) {
    e.stopPropagation();
    recordEvent('Transactions_ClickListing', {
      type: this.type,
    });
  }

  onRowClick() {
    this.trigger('clickRow', { view: this });
    recordEvent('Transactions_ClickOrder', {
      type: this.type,
    });
  }

  render() {
    super.render();

    loadTemplate('transactions/table/row.html', (t) => {
      this.$el.html(t({
        type: this.type,
        ...this._state,
        ...this.model.toJSON(),
        userCurrency: app.settings.get('localCurrency'),
        moment,
        vendorId: this.type === 'sales' ? app.profile.id : this.model.get('vendorId'),
      }));
    });

    const coinType = this.model.get('coinType');

    if (coinType) {
      const paymentCoin = this.model.get('paymentCoin');
      let tradingPairClass = 'cryptoTradingPairSm';

      if (paymentCoin.length > 5 && coinType.length > 5) {
        tradingPairClass += ' longCurCodes';
      }

      if (this.cryptoTradingPair) this.cryptoTradingPair.remove();
      this.cryptoTradingPair = this.createChild(CryptoTradingPair, {
        initialState: {
          tradingPairClass,
          exchangeRateClass: 'hide',
          fromCur: paymentCoin,
          toCur: coinType,
          truncateCurAfter: 5,
        },
      });
      this.getCachedEl('.js-cryptoTradingPairWrap')
        .html(this.cryptoTradingPair.render().el);
    }

    return this;
  }
}
