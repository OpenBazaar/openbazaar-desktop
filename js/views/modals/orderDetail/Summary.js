import { clipboard } from 'electron';
import '../../../utils/velocity';
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
      'click .js-copyOrderId': 'onClickCopyOrderId',
    };
  }

  onClickCopyOrderId() {
    clipboard.writeText(this.model.id);
    this.$copiedToClipboard
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.$copiedToClipboard
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  get $copiedToClipboard() {
    return this._$copiedToClipboard ||
      (this._$copiedToClipboard = this.$('.js-copiedToClipboard'));
  }

  remove() {
    super.remove();
  }

  render() {
    loadTemplate('modals/orderDetail/summary.html', t => {
      this.$el.html(t({
        id: this.model.id,
        ...this.model.toJSON(),
      }));

      this._$copiedToClipboard = null;

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
