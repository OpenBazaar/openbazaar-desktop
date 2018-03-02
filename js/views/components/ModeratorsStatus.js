import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      className: 'moderatorStatus',
      ...options,
      initialState: {
        hidden: true,
        showSpinner: true,
        spinnerTimer: true,
        showLoadBtn: false,
        loaded: 0,
        total: 0,
        mode: 'loaded',
        ...(options.initialState || {}),
      },
    };

    super(opts);
    this.options = opts;
  }

  events() {
    return {
      'click .js-browseMore': 'clickBrowseMore',
    };
  }

  clickBrowseMore() {
    this.trigger('browseMore');
  }

  remove() {
    clearTimeout(this.spinnerTimeout);
    super.remove();
  }

  render() {
    loadTemplate('components/moderatorsStatus.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
      if (this.spinnerTimeout) clearTimeout(this.spinnerTimeout);
      if (this._state.showSpinner && this._state.spinnerTimer) {
        // hide the spinner after a delay if the parent doesn't hide it
        this.spinnerTimeout = setTimeout(() => {
          this.setState({ showSpinner: false });
        }, 10000);
      }
    });

    return this;
  }
}
