import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';

export default class extends Collection {
  url() {
    return app.getServerUrl('ob/notifications');
  }

  parse(response) {
    // let pickles = [];
    // const zippo = [ ...response.notifications ];

    // zippo.forEach(notif => {
    //   delete notif.id;
    // });

    // for (var i = 0; i < 100; i++) {
    //   pickles = pickles.concat(response.notifications);
    // }

    // return pickles;

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
