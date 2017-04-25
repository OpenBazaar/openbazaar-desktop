import moment from 'moment';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'purchases tx5';
  }

  render() {
    loadTemplate('transactions/purchases.html', (t) => {
      this.$el.html(t({
        moment,
      }));
    });

    return this;
  }
}
