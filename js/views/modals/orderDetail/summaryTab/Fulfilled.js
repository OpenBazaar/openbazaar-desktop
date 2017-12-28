import _ from 'underscore';
import moment from 'moment';
import { clipboard } from 'electron';
import '../../../../utils/lib/velocity';
import app from '../../../../app';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

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
      ...options.initialState || {},
    };

    this.dataObject = options.dataObject;
  }

  className() {
    return 'fulfilledEvent rowLg';
  }

  events() {
    return {
      'click .js-copyTrackingNumber': 'onClickCopyTrackingNumber',
    };
  }

  onClickCopyTrackingNumber() {
    clipboard.writeText(this.dataObject.physicalDelivery[0].trackingNumber);
    this.$trackingCopiedToClipboard
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.$trackingCopiedToClipboard
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  get $trackingCopiedToClipboard() {
    return this._$copiedToClipboard ||
      (this._$copiedToClipboard = this.$('.js-trackingCopiedToClipboard'));
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
    loadTemplate('modals/orderDetail/summaryTab/fulfilled.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.dataObject || {},
        moment,
      }));

      this._$copiedToClipboard = null;
    });

    return this;
  }
}
