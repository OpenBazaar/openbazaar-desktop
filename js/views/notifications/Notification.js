import moment from 'moment';
import app from '../../app';
import { getNotifDisplayData } from '../../collections/Notifications';
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
    const route = this.getNotifDisplayData().route;
    if (route) {
      location.hash = route;
      this.trigger('navigate');
    }
  }

  getNotifDisplayData() {
    return getNotifDisplayData(this.model.toJSON().notification);
  }

  render() {
    super.render();

    loadTemplate('notifications/notification.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
        ...this.model.toJSON(),
        notifText: this.getNotifDisplayData().text,
        ownGuid: app.profile.id,
        moment,
      }));
    });

    return this;
  }
}
