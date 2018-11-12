import moment from 'moment';
import app from '../../../../app';
import { abbrNum } from '../../../../utils';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        buyerName: '',
        userCurrency: app.settings.get('localCurrency') || 'BTC',
        isCrypto: false,
        blockChainTxUrl: '',
        ...options.initialState,
      },
    });

    if (!this.model) {
      throw new Error('Please provide a model.');
    }
  }

  className() {
    return 'refunded rowLg';
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/refunded.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
        abbrNum,
        moment,
      }));
    });

    return this;
  }
}
