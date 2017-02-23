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
});
