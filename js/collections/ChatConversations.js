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

  parse(response) {
    // until lastMessage and unread are provided, we'll fudge them
    const lastMessages = [
      'I\'ll meet ya at tha crossroads dawg.',
      'Are you talking to me? I don\'t think you are talking to me in that' +
        'manner, eh? Is this all she wrote?',
      'Straight fleecin it out playa',
      'They be smashing my flo yo',
      'What in the hell?',
      'The winter winds came slow and heavy, the bean broth was slightly over done.',
    ];

    const unreads = [3, 6, 7, 1, 0, 4, 18, 5];

    let resp = response.map((convo, index) => ({
      ...convo,
      lastMessage: lastMessages[index % lastMessages.length],
      unread: unreads[index % unreads.length],
    }));

    // return resp.filter(convo => (convo.peerId !== app.profile.guid));

    resp = resp.filter(convo => (convo.peerId !== app.profile.guid));

    if (resp.length) {
      while (resp.length < 50) {
        resp = [...resp, ...resp];
      }

      resp = resp.slice(1)
        .map(convo => ({
          ...convo,
          peerId: Date.now() + Math.random(),
        }));
    }

    return resp;
  },
});
