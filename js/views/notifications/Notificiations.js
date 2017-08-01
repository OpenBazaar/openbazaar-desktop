import { capitalize } from '../../utils/string';
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
      'click .js-edit': 'onClickEdit',
    };
  }

  createAllNotifList() {
    const notifList = new NotificationsList({
      collection: new Notifications(),
      $scrollContainer: this.getCachedEl('.js-tabContainer'),
    });

    this.listenTo(notifList, 'notifNavigate', () => this.trigger('notifNavigate', { list: 'all' }));

    return notifList;
  }

  render() {
    super.render();
    const state = this.getState();

    loadTemplate('notifications/notifications.html', (t) => {
      this.$el.html(t({}));
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

    this.getCachedEl('.js-tabContainer').html(notifList.el);

    return this;
  }
}
