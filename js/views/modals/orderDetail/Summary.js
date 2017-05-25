import BaseVw from '../../baseVw';
import StateProgressBar from './StateProgressBar';
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
        id: this.model.id,
        ...this.model.toJSON(),
      }));

      // this._$filterCheckboxes = null;

      this.stateProgressBar = this.createChild(StateProgressBar, {
        initialState: {
          states: ['Paid', 'Accepted', 'Fulfilled', 'Complete'],
          currentState: 1,
        },
      });
      this.$('.js-statusProgressBarContainer').html(this.stateProgressBar.render().el);
    });

    return this;
  }
}
