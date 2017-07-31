/*
  ListFetcher is a bit of a misnomer. This view doesn't really fetch the notifications, it just
  displays the status of the fetch (i.e. a spinner during the fetch and an error message and
  retry button if it fails).
*/

import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        noResults: false,
        fetchError: '',
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'listFetcher';
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

    loadTemplate('notifications/listFetcher.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
