import moment from 'moment';
import app from '../../app';
import { getNotifDisplayData } from '../../collections/Notifications';
import { setTimeagoInterval } from '../../utils/';
import { recordEvent } from '../../utils/metrics';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        ...options.initialState || {},
      },
      ...options,
    };

    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(opts);
    this.options = opts;
    this.listenTo(this.model, 'change', () => this.render());

    this.timeAgoInterval = setTimeagoInterval(this.model.get('timestamp'), () => {
      const timeAgo = moment(this.model.get('timestamp')).fromNow();
      if (timeAgo !== this.renderedTimeAgo) this.render();
    });
  }

  className() {
    return 'notification';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick() {
    recordEvent('Notifications_NotificationClick', {
      type: this.model.get('type'),
      read: this.model.get('read'),
    });
    const route = this.getNotifDisplayData().route;
    if (route) {
      location.hash = route;
      this.trigger('navigate');
    }
  }

  getNotifDisplayData() {
    return getNotifDisplayData(this.model.toJSON().notification);
  }

  remove() {
    this.timeAgoInterval.cancel();
    super.remove();
  }

  render() {
    super.render();
    this.renderedTimeAgo = moment(this.model.get('timestamp')).fromNow();

    loadTemplate('notifications/notification.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
        ...this.model.toJSON(),
        notifText: this.getNotifDisplayData().text,
        ownGuid: app.profile.id,
        renderedTimeAgo: this.renderedTimeAgo,
        moment,
      }));
    });

    return this;
  }
}
