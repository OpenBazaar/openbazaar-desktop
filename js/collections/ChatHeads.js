import { Collection } from 'backbone';
import ChatHead from '../models/chat/ChatHead';
import app from '../app';

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
  //   const moo = [{ ...response[0] }];

  //   for (let i = 0; i < 100; i++) {
  //     moo.push({
  //       ...response[0],
  //       peerId: String(i),
  //       lastMessage: `${i}: ${response[0].lastMessage}`,
  //     });
  //   }

  //   return moo;
  // }
}
