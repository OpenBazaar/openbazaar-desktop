import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import { clipboard } from 'electron';
import '../../../../utils/lib/velocity';
import app from '../../../../app';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import is from 'is_js';
import { stripHtml } from '../../../../utils/dom';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.dataObject) {
      throw new Error('Please provide a vendorOrderFulfillment data object.');
    }

    this._state = {
      contractType: 'PHYSICAL_GOOD',
      isLocalPickup: false,
      showPassword: false,
      noteFromLabel:
        app.polyglot.t('orderDetail.summaryTab.fulfilled.noteFromVendorLabel'),
      coinType: '',
      ...options.initialState || {},
    };

    this.dataObject = options.dataObject;
  }

  className() {
    return 'fulfilledEvent rowLg';
  }

  events() {
    return {
      'click .js-copyText': 'onClickCopyText',
    };
  }

  onClickCopyText(e) {
    const $target = $(e.target);
    clipboard.writeText($target.attr('data-content'));
    this.getCachedEl($target.attr('data-status-indicator'))
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.getCachedEl($target.attr('data-status-indicator'))
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    const cryptocurrencyDelivery = this.dataObject.cryptocurrencyDelivery;
    let transactionIDOrUrl = cryptocurrencyDelivery && cryptocurrencyDelivery[0] || {};
    transactionIDOrUrl = transactionIDOrUrl.transactionID || '';
    const isTransactionIdAUrl = is.url(transactionIDOrUrl);

    transactionIDOrUrl = stripHtml(transactionIDOrUrl);

    loadTemplate('modals/orderDetail/summaryTab/fulfilled.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.dataObject || {},
        isTransactionIdAUrl,
        transactionIDOrUrl,
        moment,
      }));
    });

    return this;
  }
}
