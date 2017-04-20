import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'sales';
  }

  render() {
    loadTemplate('transactions/sales.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}
