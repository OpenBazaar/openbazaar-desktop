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

  /**
   * Returns an aggregrate count of all the unread count within each chat head.
   */
  get totalUnreadCount() {
    return this.reduce((total, md) => (total + md.get('unread')), 0);
  }
}
