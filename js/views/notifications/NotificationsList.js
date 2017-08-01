import _ from 'underscore';
import { isScrolledIntoView } from '../../utils/dom';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import ListFetcher from './ListFetcher';
import Notif from './Notification';

export default class extends BaseVw {
  constructor(options = {}) {
    // const opts = {
    //   ...options,
    // };

    if (!options.$scrollContainer || !options.$scrollContainer.length) {
      throw new Error('Please provide a jQuery object containing the scrollable element ' +
        'this view is in.');
    }

    super(options);

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.options = options;
    this.notifViews = [];

    if (!this.collection.length) this.$el.addClass('noNotifications');
    this.listenTo(this.collection, 'update', (cl, opts) => {
      this.$el.toggleClass('noNotifications', !this.collection.length);

      if (opts.changes.added.length) {
        // Expecting either a single new notifcation on the bottom (will
        // be rendered on top) or a page of notifications on top (will be
        // rendered on the bottom).
        if (opts.changes.added[opts.changes.added.length - 1] === this.collection.at(0)) {
          // It's a page of notifcations at the bottom
          this.renderNotifications(opts.changes.added, 'append');
        } else {
          // New notification at top
          this.renderNotifications(opts.changes.added, 'prepend');
        }
      }
    });

    this.$scrollContainer = options.$scrollContainer;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    this.fetchNotifications();

    console.log('zoo');
    window.zoo = this;
  }

  className() {
    return 'notificationsList navList listBox clrBr';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  onScroll() {
    if (this.collection.length && !this.allLoaded) {
      // fetch next batch of notifications
      const lastNotif = this.notifViews[this.notifViews.length - 1];

      console.log('laster');
      window.lastNotif = lastNotif;

      if (!this.isFetching && isScrolledIntoView(lastNotif.el, this.$scrollContainer[0])) {
        this.fetchNotifications();
      }
    }
  }

  get notifsPerFetch() {
    // return 20;
    return 3;
  }

  get isFetching() {
    return this.notifFetch &&
      this.notifFetch.state() === 'pending';
  }

  get allLoaded() {
    return this.collection.length >= this.countAtFirstFetch;
  }

  fetchNotifications() {
    if (this.notifFetch) this.notifFetch.abort();

    const fetchParams = {
      limit: this.notifsPerFetch,
    };

    if (this.collection.length) {
      fetchParams.offsetId = this.collection.at(0).id;
    }

    this.notifFetch = this.collection.fetch({
      data: fetchParams,
      remove: false,
    });

    if (this.listFetcher) {
      this.listFetcher.setState({
        isFetching: true,
        fetchFailed: false,
        fetchError: '',
      });
    }

    this.notifFetch.done((data, txtStatus, xhr) => {
      if (xhr.statusText === 'abort') return;

      const state = {
        isFetching: false,
        fetchFailed: false,
        noResults: false,
        fetchError: '',
      };

      if (typeof this.countAtFirstFetch === 'undefined') {
        this.countAtFirstFetch = data.total;

        if (!data.notifications.length) {
          state.noResults = true;
        }
      }

      this.listFetcher.setState(state);
    }).fail(xhr => {
      this.listFetcher.setState({
        isFetching: false,
        fetchFailed: true,
        fetchError: xhr.responseJSON && xhr.responseJSON.reason || '',
      });
    });
  }

  renderNotifications(models = [], insertionType = 'append') {
    if (!models) {
      throw new Error('Please provide an array of notification models.');
    }

    if (['append', 'prepend', 'replace'].indexOf(insertionType) === -1) {
      throw new Error('Please provide a valid insertion type.');
    }

    if (insertionType === 'replace') {
      this.notifViews.forEach(notif => notif.remove());
      this.notifViews = [];
    }

    const notifsFrag = document.createDocumentFragment();

    models.forEach(notif => {
      const view = this.createNotifView(notif);
      this.notifViews.push(view);
      view.render().$el.appendTo(notifsFrag);
    });

    if (insertionType === 'prepend') {
      this.getCachedEl('.js-notifsContainer').prepend(notifsFrag);
    } else {
      this.getCachedEl('.js-notifsContainer').append(notifsFrag);
    }
  }

  createNotifView(model, options = {}) {
    const view = this.createChild(Notif, {
      model,
      ...options,
    });

    this.listenTo(view, 'navigate', () => this.trigger('notifNavigate', { view }));

    return view;
  }

  remove() {
    if (this.notifFetch) this.notifFetch.abort();
    super.remove();
  }

  render() {
    super.render();

    loadTemplate('notifications/notificationsList.html', (t) => {
      this.$el.html(t({
        notifications: this.collection.toJSON(),
      }));
    });

    this.$scrollContainer.off('scroll', this.throttledOnScroll)
      .on('scroll', this.throttledOnScroll);

    if (this.listFetcher) this.listFetcher.remove();

    this.listFetcher = this.createChild(ListFetcher, {
      initialState: {
        isFetching: this.notifFetch && this.notifFetch.state() === 'pending',
        fetchFailed: this.notifFetch && this.notifFetch.state() === 'rejected',
        fetchError: this.notifFetch && this.notifFetch.responseJSON &&
          this.notifFetch.responseJSON.reason || '',
      },
    });

    this.listenTo(this.listFetcher, 'retry-click', () => {
      // Timeout is needed because otherwise when the listFetcher state changes and
      // the retry button is no longer in the dom, the doc click handler in pagenav
      // closes the menu. The notifContainer stops bubbling, so it shouldn't make it
      // to the doc handler, but something gets wonky if it's ripped out of the dom.
      setTimeout(() => {
        this.fetchNotifications();
      });
    });
    this.getCachedEl('.js-fetcherContainer').html(this.listFetcher.render().el);

    this.renderNotifications(this.collection.models, 'replace');

    return this;
  }
}
