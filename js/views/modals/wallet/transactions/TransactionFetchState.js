import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'transactionFetchState';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  onClickRetryFetch() {
    this.trigger('clickRetryFetch');
  }

  render() {
    loadTemplate('modals/wallet/transactions/transactionFetchState.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
