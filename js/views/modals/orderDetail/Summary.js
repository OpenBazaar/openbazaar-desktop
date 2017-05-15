import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.options = opts || {};
  }

  className() {
    return 'summaryTab';
  }

  events() {
    return {
      // 'change .filter input': 'onChangeFilter',
    };
  }

  render() {
    loadTemplate('modals/orderDetail/summary.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));

      this._$filterCheckboxes = null;
    });

    return this;
  }
}
