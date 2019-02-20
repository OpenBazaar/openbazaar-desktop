import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      className: 'moderatorStatus',
      ...options,
      initialState: {
        hidden: true,
        showSpinner: true,
        showLoadBtn: false,
        loaded: 0,
        toLoad: 0,
        total: 0,
        mode: 'loaded',
        loading: false,
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

  setState(state = {}, options = {}) {
    const combinedState = { ...this.getState(), ...state };
    // Any time the state is set to loading, set the spinner timer if needed.
    if (state.loading && combinedState.showSpinner) {
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = setTimeout(() => {
        let mode = this.getState().mode;
        if (mode === 'loadingXofY') mode = 'loadingXofYTimedOut';
        this.setState({ showSpinner: false, mode });
      }, 10000);
    }
    super.setState(state, options);
  }

  clickBrowseMore() {
    this.trigger('browseMore');
  }

  remove() {
    clearTimeout(this.spinnerTimeout);
    super.remove();
  }

  render() {
    loadTemplate('components/moderators/status.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
