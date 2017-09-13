import $ from 'jquery';
import moment from 'moment';
import { getEmojiByName } from '../../data/emojis';
import { isMultihash } from '../../utils';
import sanitizeHtml from 'sanitize-html';
import twemoji from 'twemoji';
import app from '../../app';
import BaseModel from '../BaseModel';

/**
 * Will return a processed chat messages with changes appropriate for the UI (e.g. emojis will be
 * twemojified, ob urls will be turned into links, etc...).
 */
export function processMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Please provide a message as a string.');
  }

  let processedMessage = message;

  // jquery's html function converts &'s to &amps which messes with some of our
  // string replacements, particulary when the &amps are in an ob link. So, we'll
  // replace them with something else and then replace them back later.
  processedMessage = processedMessage.replace(/&amp;/g, '__ob-full-amp__')
    .replace(/&/g, '__ob-compact-amp__');

  let $message = $(`<div>${processedMessage}</div>`);
  const anchors = [];

  // Ensure any OB links, handles (must be @ prefaced) or GUIDS are turned into anchor tags.

  // First we'll pull out any existing anchors and set them aside since we want to
  // leave those alone (i.e. avoid wrapping a guid / handle that's already in an anchor in
  // another one).
  $message.find('a')
    .each((index, el) => {
      anchors.push(el);
      $(el).replaceWith($('<div />').addClass('__ob-replaced-anchor__'));
    });

  const wordsToAnchorify = [];
  const findWords = node => {
    if (node.nodeType === 3) {
      // It's a text node. Loop through each word and if it's a guid or handle we keep track of it
      // so later we'll wrap it in an anchor element.
      node.textContent.replace(/\r\n/g, ' ')
        .replace('\n', ' ')
        .match(/\S+\s*/g)
        .forEach(word => {
          const w = word.trim();
          if (wordsToAnchorify.includes(w)) return;

          if ((w.startsWith('@') && w.length > 1) ||
            (w.startsWith('ob://') && w.length > 5) ||
            isMultihash(w)) {
            wordsToAnchorify.push(w);
          }
        });
    } else {
      node.childNodes.forEach(child => findWords(child));
    }
  };

  findWords($message[0]);

  processedMessage = $message.html();

  wordsToAnchorify.forEach(word => {
    const w = word.startsWith('ob://') ? word.slice(5) : word;
    processedMessage = processedMessage
      .split(word)
      .join(`<a href="#ob://${w}" class="clrTEm">${word}</a>`);
  });

  // restore the anchors we pulled out earlier
  $message = $(`<div>${processedMessage}</div>`);
  $message.find('.__ob-replaced-anchor__')
    .each((index, el) => {
      $(el).replaceWith($(anchors[index]).addClass('clrTEm'));
    });

  processedMessage = $message.html()
    .replace(/__ob-full-amp__/g, '&amp;')
    .replace(/__ob-compact-amp__/g, '&');

  // convert any unicode emoji characters to images via Twemoji
  processedMessage = twemoji.parse(processedMessage,
    icon => (`../imgs/emojis/72X72/${icon}.png`));

  return processedMessage;
}

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

  get isGroupChatMessage() {
    return !!this.get('peerIds');
  }

  static get max() {
    return {
      subjectLength: 500,
      messageLength: 20000,
    };
  }

  url() {
    return app.getServerUrl(`ob/${this.isGroupChatMessage ? 'groupchat' : 'chat'}/`);
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    if (typeof attrs.message === 'string') {
      // Convert any emoji placeholder (e.g :smiling_face:) into
      // emoji unicode characters.
      const emojiPlaceholderRegEx = new RegExp(':.+?:', 'g');
      const matches = attrs.message.match(emojiPlaceholderRegEx, 'g');

      if (matches) {
        matches.forEach(match => {
          const emoji = getEmojiByName(match);

          if (emoji && emoji.char) {
            attrs.message = attrs.message.replace(match, emoji.char);
          }
        });
      }

      // sanitize the message
      attrs.message = sanitizeHtml(attrs.message);

      // Generate a processed message with changes to the message that are specific to our UI.
      attrs.processedMessage = processMessage(attrs.message);
    } else {
      // The processedMessage is automatically derived from the message and should not
      // be set directly.
      delete attrs.processedMessage;
    }

    return super.set(attrs, opts);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const max = this.constructor.max;

    if (!this.isGroupChatMessage) {
      if (!attrs.peerId) {
        addError('peerId', 'The peerId is required');
      }
    } else if (!Array.isArray(attrs.peerIds) || !attrs.peerIds.length) {
      addError('peerIds', 'peerIds must be provided as an array.');
    }

    if (attrs.subject !== undefined && typeof attrs.subject !== 'string') {
      addError('subject', 'If providing a subject, it must be provided as a string.');
    } else if (attrs.subject.length > max.subjectLength) {
      addError('subject', `The subject exceeds the max length of ${max.subjectLength}`);
    } else if (this.isGroupChatMessage && !attrs.subject) {
      addError('subject', 'A subject is required for a group chat message.');
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
      const timestamp = moment(Date.now()).format();
      options.attrs.timestamp = timestamp;
      this.set('timestamp', timestamp);
    }

    return super.sync(method, model, options);
  }
}
