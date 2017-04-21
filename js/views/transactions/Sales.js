import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import { parseEmoji } from '../../utils/templateHelpers';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    console.log('moo');
    window.moo = parseEmoji;
  }

  className() {
    return 'sales tx5';
  }

  render() {
    loadTemplate('transactions/sales.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}
