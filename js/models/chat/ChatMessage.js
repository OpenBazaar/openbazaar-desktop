import moment from 'moment';
import app from '../../app';
import BaseModel from '../BaseModel';

export default class ChatMessage extends BaseModel {
  defaults() {
    return {
      subject: '',
      message: '',
      read: false,
      outgoing: true,
    };
  }

  get idAttribute() {
    return 'messageId';
  }

  static get max() {
    return {
      subjectLength: 500,
      messageLength: 20000,
    };
  }

  url() {
    return app.getServerUrl('ob/chat/');
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const max = this.constructor.max;

    if (!attrs.peerId) {
      addError('peerId', 'The peerId is required');
    }

    if (attrs.subject.length > max.subjectLength) {
      addError('subject', `The subject exceeds the max length of ${max.subjectLength}`);
    }

    if (attrs.message.length > max.messageLength) {
      addError('message', `The message exceeds the max length of ${max.messageLength}`);
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    options.attrs = options.attrs || model.toJSON(options);

    if (method === 'create') {
      options.attrs.timestamp = moment(Date.now()).format();
    }

    return super.sync(method, model, options);
  }
}

/**
 * Use this function if you need to send a chat message outside of the main Chat view.
 * This will ensure that the sending of the message is communicated to the Chat view and
 * the relevant chat head and convo is updated.
 * @param {Object} fields An object containing the arguments to the send message call.
 * The only required field is peerId, but you almost certainly want to pass in a message as
 * well.
 * @returns {Object} The jqXhr representing the POST call to the server.
 */
export function sendMessage(fields) {
  const model = new ChatMessage({
    ...fields,
    outgoing: true,
  });
  const save = model.save();

  if (!save) {
    Object.keys(model.validationError)
      .forEach(errorKey => {
        throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
      });
  } else {
    save.done(() => {
      if (app && app.chat) {
        if (app.chat.conversation &&
          app.chat.conversation.guid === model.get('peerId') &&
          typeof app.chat.conversation.onMessageSent === 'function') {
          // If theres an active convo for the message recipient, we'll let the convo
          // know of the message and it will let it's parent know so the chat head
          // is added / updated.
          app.chat.conversation.onMessageSent.call(app.chat.conversation, model);
        } else if (typeof app.chat.onNewChatMessage === 'function') {
          // If no active convo for the recipient of the message, we'll let the chat
          // app know and it will handle adding the chat head in.
          app.chat.onNewChatMessage.call(app.chat, model.toJSON());
        }
      }
    });
  }

  return save;
}
