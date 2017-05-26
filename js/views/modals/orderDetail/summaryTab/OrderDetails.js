import moment from 'moment';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a Listing model.');
    }

    // todo: should we enforce a timestamp coming in? will it bomb the template if its not there?

    this.options = options;
  }

  className() {
    return 'orderDetails';
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/orderDetails.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        moment,
        timestamp: this.options.timestamp,
      }));
    });

    return this;
  }
}
