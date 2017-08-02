import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';

export default class extends Collection {
  url() {
    return app.getServerUrl('ob/notifications');
  }

  parse(response) {
    return response.notifications.map(notif => {
      const innerNotif = notif.notification;

      return {
        id: innerNotif.notificationId,
        notification: _.omit(innerNotif, 'notificationId'),
        ...notif,
      };
    });
  }

  comparator(message) {
    return message.get('timestamp');
  }
}
