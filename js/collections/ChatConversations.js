import { Collection } from 'backbone';
import ChatHead from '../models/chat/ChatHead';
import app from '../app';

module.exports = Collection.extend({
  /* we have to use the older style for this collection, the ES6 style creates a bug where models
  cannot be removed using their ids */

  url() {
    return app.getServerUrl('ob/chatconversations');
  },

  model: ChatHead,

  comparator(convo) {
    return -convo.get('unread');
  },

  parse(response) {
    let resp = response.filter(convo => (convo.peerId !== app.profile.guid));

    if (resp.length) {
      while (resp.length < 50) {
        resp = [...resp, ...resp];
      }

      resp = resp.slice(1)
        .map(convo => ({
          ...convo,
          peerId: Date.now() + Math.random(),
          // unread: Math.floor(Math.random() * 20) + 0,
          unread: 0,
        }));

      resp[0].unread = 5;
    }

    return resp;
  },
});
