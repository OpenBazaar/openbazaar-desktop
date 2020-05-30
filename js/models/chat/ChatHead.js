import { processMessage } from './ChatMessage';
import sanitizeHtml from 'sanitize-html';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'peerId';
  }

  url() {
    return app.getServerUrl('v1/ob/chatconversation');
  }

  parse(response) {
    const processedMessage = processMessage(sanitizeHtml((response.lastMessage)));

    return {
      ...response,
      lastMessage: processedMessage,
    };
  }
}

