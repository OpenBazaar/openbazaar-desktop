import moment from 'moment';
import {
  events as orderEvents,
} from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      disputerName: '',
      claim: '',
      showResolveButton: false,
      ...options,
      initialState: {
        ...options.initialState,
      },
    };

    super(opts);

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
    this.trigger('clickResolveDispute');
  }

  render() {
    const state = this.getState();
    loadTemplate('modals/orderDetail/summaryTab/disputeStarted.html', (t) => {
      this.$el.html(t({
        ...state,
        moment,
      }));
    });

    return this;
  }
}
