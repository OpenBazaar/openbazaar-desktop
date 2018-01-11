import { isBlocked, events as blockEvents } from '../utils/block';
import { Collection } from 'backbone';
import ChatHead from '../models/chat/ChatHead';
import app from '../app';

export default class extends Collection {
  constructor(...args) {
    super(...args);
    this._blockedHeads = {};

    this.listenTo(blockEvents, 'unblocked', data => {
      data.peerIds.forEach(peerId => {
        if (this._blockedHeads[peerId]) {
          this.add(this._blockedHeads[peerId], { parse: true });
          delete this._blockedHeads[peerId];
        }
      });
    });

    this.listenTo(blockEvents, 'blocked', data => {
      data.peerIds.forEach(peerId => {
        const md = this.get(peerId);

        if (md) {
          this._blockedHeads[peerId] = md.toJSON();
        }
      });
      this.remove(data.peerIds);
    });
  }

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

  parse(response = []) {
    if (Array.isArray(response)) {
      // Remove any items from blocked nodes, but keep track of them
      // in case the relevant nodes are unblocked.
      const parsedResponse = response.filter(head => {
        if (isBlocked(head.peerId)) {
          this._blockedHeads[head.peerId] = head;
          return false;
        }

        return true;
      });

      return parsedResponse;
    }

    return response;
  }
}
