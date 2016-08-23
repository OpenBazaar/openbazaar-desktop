import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  render() {
    loadTemplate('transactionsPage.html', (t) => {
      this.$el.html(t({
        tab: this.options.tab || '',
      }));
    });

    return this;
  }
}
