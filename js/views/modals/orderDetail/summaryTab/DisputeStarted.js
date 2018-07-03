import _ from 'underscore';
import moment from 'moment';
import {
  events as orderEvents,
} from '../../../../utils/order';
import { recordEvent } from '../../../../utils/metrics';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      disputerName: '',
      claim: '',
      showResolveButton: true,
      ...options.initialState || {},
    };

    this.listenTo(orderEvents, 'resolveDisputeComplete', () => {
      this.setState({
        showResolveButton: false,
      });
    });
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
    recordEvent('OrderDetails_DisputeResolveStart');
    this.trigger('clickResolveDispute');
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
    loadTemplate('modals/orderDetail/summaryTab/disputeStarted.html', (t) => {
      this.$el.html(t({
        ...this._state,
        moment,
      }));
    });

    return this;
  }
}
