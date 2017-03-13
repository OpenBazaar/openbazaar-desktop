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
}
