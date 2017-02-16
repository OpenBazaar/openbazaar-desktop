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

  // parse(response) {
  //   let resp = response.filter(chatHead => (chatHead.peerId !== app.profile.guid));

  //   if (resp.length) {
  //     while (resp.length < 50) {
  //       resp = [...resp, ...resp];
  //     }

  //     resp = resp.map(chatHead => ({
  //       ...chatHead,
  //       peerId: Date.now() + Math.random(),
  //       unread: Math.floor(Math.random() * 20) + 0,
  //     }));

  //     resp[43].unread = 0;
  //     resp[44].unread = 0;
  //     resp[45].unread = 0;
  //     resp[46].unread = 0;
  //     resp[47].unread = 0;
  //     resp[48].unread = 0;
  //     resp[49].unread = 0;
  //     resp[50].unread = 0;
  //   }

  //   return resp;
  // },
});
