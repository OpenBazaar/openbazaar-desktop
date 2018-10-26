import $ from 'jquery';
import app from '../../app';
import { capitalize } from '../../utils/string';
import { recordEvent } from '../../utils/metrics';
import loadTemplate from '../../utils/loadTemplate';
import Notifications from '../../collections/Notifications';
import BaseVw from '../baseVw';
import NotificationsList from './NotificationsList';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        tab: 'all',
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.notifListsCache = {};
  }

  get tagName() {
    return 'section';
  }

  className() {
    return 'notifications clrBr border clrP clrSh1';
  }

  events() {
    return {
      'click .js-tab[data-tab]': 'onClickTab',
    };
  }

  onClickTab(e) {
    const tab = e.target.getAttribute('data-tab');
    recordEvent('Notifications_Tab', { tab });
    // Timeout needed so event can bubble to a page nav handler before the view is re-rendered
    // and the target element is ripped out of the dom.
    setTimeout(() => {
      this.setState({ tab });
    });
  }

  /**
   * If there are any loaded notifications, this method will kick off a server
   * call that will mark all notifications (seen and unseen) as read. If there
   * are no loaded notifications (possibly because a initial page is being fetched),
   * it will return false and not kick off any server call.
   * @return {boolean|object} False if no notifications have been loaded, otherwise
   *   the xhr of the call to the server
   */
  markNotifsAsRead() {
    // Going to optimistically mark all as read and switch back if the call fails.
    const notifs = [];

    Object.keys(this.notifListsCache).forEach(listType => {
      this.notifListsCache[listType].collection
        .forEach(notif => {
          notif.set('read', true);
          notifs.push(notif);
        });
    });

    if (!notifs.length) return false;

    return $.post(app.getServerUrl('ob/marknotificationsasread'))
      .fail(() => notifs.forEach(notif => notif.set('read', false)));
  }

  /**
   * Will set the tab to 'All' and set the scroll position to the top - useful
   * when hiding the menu so that it resets to a standard initial position. It will
   * leave the collections intact, so the user won't need to fetch notifications
   * already fetched.
   */
  reset() {
    this.setState({ tab: 'all' });
    this.getCachedEl('.js-tabContainer')[0].scrollTop = 0;
  }

  createAllNotifList() {
    const notifList = this.createChild(NotificationsList, {
      collection: new Notifications(),
    });

    this.listenTo(notifList, 'notifNavigate', () => this.trigger('notifNavigate', { list: 'all' }));

    return notifList;
  }

  createOrdersNotifList() {
    const notifList = this.createChild(NotificationsList, {
      collection: new Notifications(),
      filter: 'order,declined,cancel,refund,fulfillment,orderComplete,disputeOpen,' +
        'disputeUpdate,disputeClose,disputeAccepted,vendorDisputeTimeout,buyerDisputeTimeout' +
        'buyerDisputeExpiry,moderatorDisputeExpiry',
    });

    this.listenTo(notifList, 'notifNavigate',
      () => this.trigger('notifNavigate', { list: 'order' }));

    return notifList;
  }

  createFollowersNotifList() {
    const notifList = this.createChild(NotificationsList, {
      collection: new Notifications(),
      filter: 'follow',
    });

    this.listenTo(notifList, 'notifNavigate',
      () => this.trigger('notifNavigate', { list: 'follow' }));

    return notifList;
  }

  render() {
    super.render();
    const state = this.getState();

    loadTemplate('notifications/notifications.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    let notifList = this.notifListsCache[state.tab];

    if (!notifList) {
      const createMethodName = `create${capitalize(state.tab)}NotifList`;
      if (this[createMethodName]) {
        notifList = this[createMethodName].call(this);
        notifList.render();
        this.notifListsCache[state.tab] = notifList;
      } else {
        throw new Error(`Unable to populate the ${state.tab} tab, because I was unable to ` +
          `find the ${createMethodName} function`);
      }
    }

    // If the tab we want is already the active one, do nothing.
    if (notifList !== this.activeNotifList) {
      notifList.delegateEvents();
      this.getCachedEl('.js-tabContainer').html(notifList.el);
      notifList.$scrollContainer = this.getCachedEl('.js-tabContainer');
      this.activeNotifList = notifList;
    }

    return this;
  }
}
