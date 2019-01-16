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

  setTimeout() {
    if (!this.spinnerTimeout) {
      this.spinnerTimeout = setTimeout(() => {
        let mode = this.getState().mode;
        if (mode === 'loadingXofY') mode = 'loadingXofYTimedOut';
        this.setState({ showSpinner: false, mode });
        clearTimeout(this.spinnerTimeout);
      }, 10000);
    }
  }

  render() {
    loadTemplate('components/moderatorsStatus.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
      if (this._state.showSpinner && this._state.spinnerTimer) {
        this.setTimeout();
      }
    });

    return this;
  }
}
