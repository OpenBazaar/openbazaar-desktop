import $ from 'jquery';
import _ from 'underscore';
import { getSocket } from '../../utils/serverConnect';
import { getCachedProfiles } from '../../models/profile/Profile';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import ListFetcher from './ListFetcher';
import Notif from './Notification';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      filter: '',
      ...options,
    };

    super(opts);

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    this.options = opts;
    this.notifViews = [];

    // This count represents the total number of notifications that this list
    // is to show. It's used to know when all pages have been loaded. It's determined
    // based off of the returned total from the fetch of the first page + any new
    // notifications that come over the socket.
    this.totalNotifs = 0;

    if (!this.collection.length) this.$el.addClass('noNotifications');
    this.listenTo(this.collection, 'update', (cl, updateOpts) => {
      this.$el.toggleClass('noNotifications', !this.collection.length);

      if (updateOpts.changes.added.length) {
        // Expecting either a single new notification on the bottom (will
        // be rendered on top) or a page of notifications on top (will be
        // rendered on the bottom).
        if (updateOpts.changes.added[updateOpts.changes.added.length - 1] ===
          this.collection.at(0)) {
          // It's a page of notifications at the bottom
          this.renderNotifications(updateOpts.changes.added, 'append');
        } else {
          // New notification at top
          this.renderNotifications(updateOpts.changes.added, 'prepend');
        }

        updateOpts.changes.added.forEach(notif => {
          const innerNotif = notif.get('notification');
          const types = ['follow', 'moderatorAdd', 'moderatorRemove'];

          if (types.indexOf(innerNotif.type) > -1) {
            getCachedProfiles([innerNotif.peerId])[0]
              .done(profile => {
                notif.set('notification', {
                  ...innerNotif,
                  handle: profile.get('handle') || '',
                  avatarHashes: profile.get('avatarHashes') &&
                    profile.get('avatarHashes').toJSON() || {},
                });
              });
          }
        });

        this.listFetcher.setState({ noResults: false });
      }
    });

    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    const serverSocket = getSocket();

    if (serverSocket) {
      serverSocket.on('message', e => {
        if (e.jsonData.notification && e.jsonData.notification.type !== 'unfollow') {
          const type = e.jsonData.notification.type;
          const filters = (this.options.filter || '').split(',')
            .filter(filter => filter.trim().length)
            .map(filter => filter.trim());

          if (!filters.length || filters.indexOf(type) > -1) {
            this.totalNotifs += 1;
            this.collection.add({
              id: e.jsonData.notification.notificationId,
              read: false,
              timestamp: (new Date()).toISOString(),
              notification: {
                ...(_.omit(e.jsonData.notification, 'notificationId')),
              },
            });
          }
        }
      });
    }

    this.fetchNotifications();
  }

  className() {
    return 'notificationsList navList listBox';
  }

  onScroll() {
    if (this.collection.length && !this.allLoaded && !this.isFetching
      && !this.fetchFailed) {
      // fetch next batch of notifications
      const lastNotif = this.notifViews[this.notifViews.length - 1];

      if (this.isNotifScrolledIntoView(lastNotif.el)) {
        this.fetchNotifications();
      }
    }
  }

  /*
   * isScrolledIntoView from util/dom.js is not accurately returning a result for
   * a notification because the notifications menu markup is inside the very narrow
   * pageNav bar. Since the notification is outside the pageNav's "viewport", it thinks
   * nothing within the notif menu is ever in view. It's a unique enough case that we'll
   * create a custom function here.
   */
  isNotifScrolledIntoView(notifEl) {
    const notifRect = notifEl.getBoundingClientRect();
    const scrollRect = this.$scrollContainer[0].getBoundingClientRect();

    return notifRect.top <= scrollRect.top + this.$scrollContainer[0].clientHeight;
  }

  set $scrollContainer($el) {
    if (!($el instanceof $)) {
      throw new Error('Please provide a jQuery element containing the scrollable element ' +
        ' this view is in.');
    }

    if ($el !== this._$scrollContainer) {
      if (this._$scrollContainer) {
        this._$scrollContainer.off('scroll', this.throttledOnScroll);
      }
      this._$scrollContainer = $el;
      this._$scrollContainer.on('scroll', this.throttledOnScroll);
    }
  }

  get $scrollContainer() {
    return this._$scrollContainer;
  }


  get notifsPerFetch() {
    // return 20;
    return 4;
  }

  get isFetching() {
    return this.notifFetch &&
      this.notifFetch.state() === 'pending';
  }

  get fetchFailed() {
    return this.notifFetch &&
      this.notifFetch.state() === 'rejected';
  }

  get allLoaded() {
    return this.collection.length >= this.totalNotifs;
  }

  fetchNotifications() {
    if (this.notifFetch) this.notifFetch.abort();

    const fetchParams = {
      limit: this.notifsPerFetch,
    };

    if (this.collection.length) {
      fetchParams.offsetId = this.collection.at(0).id;
    }

    if (this.options.filter) {
      fetchParams.filter = this.options.filter;
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

      if (!fetchParams.offsetId) {
        this.totalNotifs += data.total;

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
