import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        noResults: false,
        noResultsMsg: '',
        fetchFailed: false,
        fetchErrorTitle: '',
        fetchErrorMsg: '',
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'followLoadingState txCtr tx5';
  }

  events() {
    return {
      'click .js-retry': 'onClickRetry',
    };
  }

  onClickRetry() {
    this.trigger('retry-click');
  }

  render() {
    super.render();

    loadTemplate('userPage/followLoading.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
