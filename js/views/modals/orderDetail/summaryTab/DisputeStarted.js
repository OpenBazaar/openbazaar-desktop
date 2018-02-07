import _ from 'underscore';
import moment from 'moment';
import { getServerCurrency } from '../../../../data/cryptoCurrencies';
import {
  events as orderEvents,
} from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const serverCur = getServerCurrency();
    super(options);

    this._state = {
      disputerName: '',
      claim: '',
      showResolveButton: !serverCur.supportsEscrowTimeout,
      ...options.initialState || {},
    };

    if (!serverCur.supportsEscrowTimeout) {
      this.listenTo(orderEvents, 'resolveDisputeComplete', () => {
        this.setState({
          showResolveButton: false,
        });
      });
    }
  }

  className() {
    return 'disputeStartedEvent rowLg';
  }

  events() {
    return {
      'click .js-resolveDispute': 'onClickResolveDispute',
    };
  }

  onClickResolveDispute() {
    this.trigger('clickResolveDispute');
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
    loadTemplate('modals/orderDetail/summaryTab/disputeStarted.html', (t) => {
      this.$el.html(t({
        ...this._state,
        moment,
      }));
    });

    return this;
  }
}
