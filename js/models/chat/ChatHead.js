import { processMessage } from './ChatMessage';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'peerId';
  }

  url() {
    return app.getServerUrl('ob/chatconversation');
  }

  parse(response) {
    return {
      ...response,
      lastMessage: processMessage(response.lastMessage),
    };
  }
}

