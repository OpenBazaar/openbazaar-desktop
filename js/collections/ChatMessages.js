import app from '../app';
import { Collection } from 'backbone';
import ChatMessage from '../models/chat/ChatMessage';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (!options.guid) {
      throw new Error('Please provide a guid of the other person in the conversation.');
    }

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
    return app.getServerUrl(`ob/chatmessages/${this.guid}`);
  }
}
