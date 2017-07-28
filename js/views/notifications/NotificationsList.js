import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import ListFetcher from './ListFetcher';

export default class extends BaseVw {
  constructor(options = {}) {
    // const opts = {
    //   ...options,
    // };

    super(options);

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.options = options;
    this.ownFetch = null;
    this.latestFetch = null;

    if (!this.collection.length) this.$el.addClass('noNotifications');
    this.listenTo(this.collection, 'update', () => {
      this.$el.toggleClass('noNotifications', !this.collection.length);
      this.render();
    });
    this.listenTo(this.collection, 'request', this.onRequest);
    this.fetch();

    console.log('fetch');
    window.fetch = this.fetch.bind(this);
    console.log('render');
    window.render = this.render.bind(this);
  }

  className() {
    return 'notificationsList navList listBox clrBr';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  onRequest(cl, xhr) {
    this.latestFetch = xhr;

    if (this.listFetcher) {
      this.listFetcher.setState({
        isFetching: true,
        fetchFailed: false,
        fetchError: '',
      });
    }

    xhr.done(() => {
      if (xhr !== this.latestFetch || !this.listFetcher) return;

      this.listFetcher.setState({
        isFetching: false,
        fetchFailed: false,
        fetchError: '',
      });
    })
    .fail(() => {
      if (xhr !== this.latestFetch || !this.listFetcher) return;

      this.listFetcher.setState({
        isFetching: false,
        fetchFailed: true,
        fetchError: xhr.responseJSON && xhr.responseJSON.reason || '',
      });
    });
  }

  fetch() {
    if (this.ownFetch) this.ownFetch.abort();
    this.ownFetch = this.collection.fetch();
  }

  remove() {
    if (this.ownFetch) this.ownFetch.abort();
    super.remove();
  }

  render() {
    super.render();

    loadTemplate('notifications/notificationsList.html', (t) => {
      this.$el.html(t({
        notifications: this.collection.toJSON(),
      }));
    });

    if (this.listFetcher) this.listFetcher.remove();
    this.listFetcher = this.createChild(ListFetcher, {
      initialState: {
        isFetching: this.latestFetch && this.latestFetch.state() === 'pending',
        fetchFailed: this.latestFetch && this.latestFetch.state() === 'rejected',
        fetchError: this.latestFetch && this.latestFetch.responseJSON &&
          this.latestFetch.responseJSON.reason || '',
      },
    });
    this.listenTo(this.listFetcher, 'retry-click', () => {
      // Timeout is needed because otherwise when the listFetcher state changes and
      // the retry button is no longer in the dom, the doc click handler in pagenav
      // closes the menu. The notifContainer stops bubbling, so it shouldn't make it
      // to the doc handler, but something gets wonky if it's ripped out of the dom.
      setTimeout(() => {
        this.fetch();
      });
    });
    this.getCachedEl('.js-fetcherContainer').html(this.listFetcher.render().el);

    return this;
  }
}
