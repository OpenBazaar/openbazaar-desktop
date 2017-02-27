import { Collection } from 'backbone';
import ChatHead from '../models/chat/ChatHead';
import app from '../app';
// import moment from 'moment';

export default class extends Collection {
  url() {
    return app.getServerUrl('ob/chatconversations');
  }

  model(attrs, options) {
    return new ChatHead(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerId;
  }

  comparator(message) {
    return (new Date(message.get('timestamp')).getTime()) * -1;
  }

  // parse(response) {
  //   const convos = [];

  //   if (!response || !response.length) return;

  //   for (let i = 0; i < 100; i++) {
  //     const daysAhead = Math.floor(Math.random() * 6);
  //     const timestamp = moment(new Date((new Date()).getTime() + (86400000 * daysAhead)));

  //     response.forEach((convo) => {
  //       convos.push({
  //         ...convo,
  //         lastMessage: `${i + 1}: ${convo.lastMessage}`,
  //         timestamp: timestamp.format(),
  //         peerId: Math.random() + Date.now(),
  //       });
  //     });

  //     // console.log(`${i + 1}: ${timestamp.format('MMM Do YY')}`);
  //   }

  //   return convos;
  // }
}
