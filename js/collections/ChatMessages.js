import app from '../app';
import { Collection } from 'backbone';
import ChatMessage from '../models/chat/ChatMessage';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.guid = options.guid;
  }

  model(attrs, options) {
    return new ChatMessage(attrs, options);
  }

  modelId(attrs) {
    return attrs.messageId;
  }

  comparator(message) {
    return message.get('timestamp');
  }

  url() {
    let url = app.getServerUrl('ob/chatmessages');
    if (this.guid) url += `/${this.guid}`;
    return url;
  }
}
