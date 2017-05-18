import $ from 'jquery';
import _ from 'underscore';
import app from '../../../app';
import { getSocket } from '../../../utils/serverConnect';
import { getEmojiByName } from '../../../data/emojis';
import loadTemplate from '../../../utils/loadTemplate';
import ChatMessages from '../../../collections/ChatMessages';
import ChatMessage from '../../../models/chat/ChatMessage';
import baseVw from '../../baseVw';
import ConvoMessages from './ConvoMessages';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.orderId) {
      throw new Error('Please provide an orderId.');
    }

    // todo: validate that valid buyer and vendor were passed in.

    if (!options.model) {
      throw new Error('Please provide an order / case model.');
    }

    super(options);
    this.options = options;
    this.showLoadMessagesError = false;
    this.fetching = false;
    this.fetchedAllMessages = false;
    this.ignoreScroll = false;
    this.buyer = options.buyer;
    this.vendor = options.vendor;
    this.moderator = options.moderator;
    this.buyer.isTyping = false;
    this.vendor.isTyping = false;
    if (this.moderator) this.moderator.isTyping = false;

    this.messages = new ChatMessages([]);
    this.listenTo(this.messages, 'request', this.onMessagesRequest);
    this.listenTo(this.messages, 'sync', this.onMessagesSync);
    this.listenTo(this.messages, 'update', this.onMessagesUpdate);
    this.listenTo(this.messages, 'error', this.onMessagesFetchError);
    this.fetchMessages();

    const socket = getSocket();

    if (socket) {
      this.listenTo(socket, 'message', this.onSocketMessage);
    }
  }

  get messagesPerPage() {
    return 20;
  }

  className() {
    return 'discussionTab clrP noMessages';
  }

  events() {
    return {
      'click .js-retryLoadMessage': 'onClickRetryLoadMessage',
      'keyup .js-inputMessage': 'onKeyUpMessageInput',
      'keydown .js-inputMessage': 'onKeyDownMessageInput',
      'click .js-btnSend': 'onClickSend',
    };
  }

  onMessagesRequest(mdCl, xhr) {
    // Only interested in the collection sync (not any of its models).
    if (!(mdCl instanceof ChatMessages)) return;

    this.showLoadMessagesError = false;
    this.$loadMessagesError.addClass('hide');
    this.$el.addClass('loadingMessages');
    this.fetching = true;

    xhr.always(() => (this.fetching = false));
  }

  onMessagesSync(mdCl, response) {
    // Only interested in the collection sync (not any of its models).
    if (!(mdCl instanceof ChatMessages)) return;

    this.showLoadMessagesError = false;
    this.$loadMessagesError.addClass('hide');
    this.$el.removeClass('loadingMessages');

    if (response && !response.length) {
      this.fetchedAllMessages = true;
    }

    if (!this.firstSyncComplete) {
      this.firstSyncComplete = true;
      this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);

      if (this.isOpen) {
        this.markConvoAsRead();
      }
    }
  }

  onMessagesFetchError() {
    this.showLoadMessagesError = true;
    this.$loadMessagesError.removeClass('hide');
    this.$el.removeClass('loadingMessages');
  }

  onMessagesUpdate(cl, opts) {
    if (this.messages.length) {
      this.$el.removeClass('noMessages');
    }

    const prevTopModel = this.topRenderedMessageMd;

    if (!this.convoMessages) return;

    // As appropriate, update the scroll position.
    const prevScroll = {};

    prevScroll.height = this.$convoMessagesWindow[0].scrollHeight;
    prevScroll.top = this.$convoMessagesWindow[0].scrollTop;

    this.convoMessages.render();
    this.topRenderedMessageMd = this.messages.at(0);

    // Expecting either a new page of messages at the beginning of the collection or
    // a new single message at the end of the collection. In either of those scenarios
    // we'll adjust the scroll position as appopriate.

    if (opts.changes.added.length === 1) {
      // Single new message added.

      const newMessage = opts.changes.added[0];

      if (cl.indexOf(newMessage) === cl.length - 1) {
        // It's the last message.

        if (newMessage.get('outgoing')) {
          // It's our own message, so we'll auto scroll to the bottom.
          this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);
        } else if (prevScroll.top >=
          prevScroll.height - this.$convoMessagesWindow[0].clientHeight - 10) {
          // For an incoming message, if we were scrolled within 10px of the bottom at the
          // time the message came, we'll auto-scroll. Otherwise, we'll leave you where you were.
          this.setScrollTop(this.$convoMessagesWindow[0].scrollHeight);
        }
      }
    } else if (opts.changes.added.length &&
      cl.indexOf(opts.changes.added[opts.changes.added.length - 1]) !==
      prevTopModel) {
      // New page of messages added up top. We'll adjust the scroll position so there is no
      // jump as they are added in.
      this.setScrollTop(prevScroll.top +
        (this.$convoMessagesWindow[0].scrollHeight - prevScroll.height - 60));

      // the hardcode 60 is to account for the loading spinner that is going away
    }
  }

  onClickRetryLoadMessage() {
    this.fetchMessages(...this.lastFetchMessagesArgs);
  }

  onKeyUpMessageInput(e) {
    this.$btnSend.toggleClass('disabled', !e.target.value);

    // Send an empty message to indicate "typing...", but no more than 1 every
    // second.
    if (!this.lastTypingSentAt || (Date.now() - this.lastTypingSentAt) >= 1000) {
      const typingMessage = new ChatMessage({
        peerIds: this.getChatters().map(chatter => chatter.id),
        subject: this.model.id,
        message: '',
      });

      const saveTypingMessage = typingMessage.save();

      if (saveTypingMessage) {
        this.lastTypingSentAt = Date.now();
      } else {
        // Developer error - this shouldn't happen.
        console.error('There was an error saving the chat message.');
        console.dir(typingMessage.validationError);
      }
    }

    // Send actual chat message if the Enter key was pressed
    if (e.shiftKey || e.which !== 13) return;

    const message = e.target.value.trim();
    if (message) this.sendMessage(message);
    $(e.target).val('');
    e.preventDefault();
  }

  onKeyDownMessageInput(e) {
    if (!e.shiftKey && e.which === 13) e.preventDefault();
  }

  onClickSend() {
    const message = this.$inputMessage.value();
    if (message) this.sendMessage(message);
  }

  onScroll(e) {
    if (this.ignoreScroll) {
      this.ignoreScroll = false;
      this.throttleScrollHandler();
      return;
    }

    if (this.fetching || this.fetchedAllMessages
      || this.showLoadMessagesError) {
      return;
    }

    // If we come close enough to the top, let's fetch a new page.
    if (e.target.scrollTop <= 100) {
      this.fetchMessages(this.messages.at(0).id);
    }
  }

  onSocketMessage(e) {
    if (e.jsonData.message && e.jsonData.message.subject !== this.model.id) return;
    if (e.jsonData.messageTyping && e.jsonData.messageTyping.subject !== this.model.id) return;
    if (e.jsonData.messageRead && e.jsonData.messageRead.subject !== this.model.id) return;

    if (e.jsonData.message) {
      // incoming chat message
      const message = new ChatMessage({
        ...e.jsonData.message,
        outgoing: false,
      });

      this.messages.push(message);

      if (this.isOpen) {
        this.markConvoAsRead();
      }

      // We'll consider them to be done typing if an acutal message came
      // in. If they re-start typing, we'll get another socket messsage.
      // this.hideTypingIndicator();
    } else if (e.jsonData.messageTyping) {
      // Conversant is typing...
      this.showTypingIndicator();
    } else if (e.jsonData.messageRead) {
      console.log('the message was indeed read');
      // Conversant read your message
      if (this.convoMessages) {
        const model = this.messages.get(e.jsonData.messageRead.messageId);

        if (model) {
          model.set('read', true);
        }

        this.convoMessages.markMessageAsRead(e.jsonData.messageRead.messageId);
      }
    }
  }

  get typingExpires() {
    return 3000;
  }

  setTyping(id) {
    if (!id) {
      throw new Error('Please provide an id.');
    }

    const chatters = this.getChatters();
    const chatterIndex = chatters.indexOf(id);

    if (chatterIndex !== -1) {
      chatters[chatterIndex] = true;
      clearTimeout(chatters[chatterIndex].typingTimeout);
      chatters[chatterIndex].typingTimeout = setTimeout(
        () => (chatters[chatterIndex] = false),
        this.typingExpires);
      this.showTypingIndicator();
    }
  }

  showTypingIndicator() {
    clearTimeout(this.typingTimeout);
    this.setTypingIndicator();
    this.$el.addClass('isTyping');
    this.typingTimeout = setTimeout(
      () => (this.hideTypingIndicator()),
      this.typingExpires);
  }

  hideTypingIndicator() {
    clearTimeout(this.typingTimeout);
    this.$el.removeClass('isTyping');
  }

  sendMessage(msg) {
    if (!msg) {
      throw new Error('Please provide a message to send.');
    }

    let message = msg;
    this.lastTypingSentAt = null;

    // Convert any emoji placeholder (e.g :smiling_face:) into
    // emoji unicode characters.
    const emojiPlaceholderRegEx = new RegExp(':.+?:', 'g');
    const matches = message.match(emojiPlaceholderRegEx, 'g');

    if (matches) {
      matches.forEach(match => {
        const emoji = getEmojiByName(match);

        if (emoji && emoji.char) {
          message = message.replace(match, emoji.char);
        }
      });
    }

    const chatMessage = new ChatMessage({
      peerIds: this.getChatters().map(chatter => chatter.id),
      subject: this.model.id,
      message,
    });

    const save = chatMessage.save();
    let messageSent = true;

    if (save) {
      // At least for now, ignoring any server failures and optimistically adding the new
      // message to the UI. Odds are really low of server failure and repurcussions minimal.
      this.messages.push(chatMessage);
    } else {
      // Developer error - this shouldn't happen.
      console.error('There was an error saving the chat message.');
      console.dir(chatMessage.validationError);
      messageSent = false;
    }

    return messageSent;
  }

  fetchMessages(offsetId, limit = this.messagesPerPage) {
    const params = {
      limit,
      subject: this.model.id,
    };

    this.lastFetchMessagesArgs = [offsetId, limit];
    if (offsetId) params.offsetId = offsetId;

    return this.messages.fetch({
      data: $.param(params),
      remove: false,
    });
  }

  setScrollTop(value, silent = true) {
    if (typeof value !== 'number') {
      throw new Error('Please provide a value as a number.');
    }

    if (this.$convoMessagesWindow[0].scrollTop === value) return;

    if (silent) {
      // Unthrottling the scroll handler so that our ignoreScoll flag won't
      // be lumped in with a user triggered scroll. The scroll handler will
      // reset the flag and re-throttle the handler.
      this.unthrottleScrollHandler();
      this.ignoreScroll = true;
    }

    this.$convoMessagesWindow[0].scrollTop = value;
  }

  unthrottleScrollHandler() {
    this.$convoMessagesWindow.off('scroll', this.boundScrollHandler);
    this.boundScrollHandler = this.onScroll.bind(this);
    this.$convoMessagesWindow.on('scroll', this.boundScrollHandler);
  }

  throttleScrollHandler() {
    this.$convoMessagesWindow.off('scroll', this.boundScrollHandler);
    this.boundScrollHandler = _.throttle(this.onScroll, 100).bind(this);
    this.$convoMessagesWindow.on('scroll', this.boundScrollHandler);
  }

  markConvoAsRead() {
    // const queryString = this.subject ? `/?subject=${this.model.id}` : '';
    // $.post(app.getServerUrl(`ob/markchatasread/${this.vendor.id}${queryString}`));
    // this.trigger('convoMarkedAsRead');
  }

  getChatters(includeSelf = false) {
    let chatters = [
      this.buyer,
      this.vendor,
    ];

    if (this.moderator) chatters.push(this.moderator);

    if (!includeSelf) {
      chatters = chatters.filter(chatter => chatter.id !== app.profile.id);
    }

    return chatters;
  }

  getTypingIndicatorContent() {
    const chatters = [
      this.buyer,
      this.vendor,
    ];

    if (this.moderator) chatters.push(this.moderator);

    let typingText = '';

    const typers = this.getChatters().filter(chatter => chatter.isTyping);
    const names = [];

    typers.forEach(typer => {
      if (typers.length === 1) {
        if (typer.profile.state === 'resolved') {
          typer.profile.done(profile => {
            const handle = profile.get('handle');
            names.push(`${handle ? `@${handle}` : profile.id}`);
          });
        } else {
          names.push(typer.id);
        }
      }
    });

    if (names.length === 1) {
      typingText = app.polyglot.t('orderDetail.discussionTab.isTyping', { user: name[0] });
    } else if (names.length === 2) {
      typingText = app.polyglot.t('orderDetail.discussionTab.areTyping', {
        user1: name[0],
        user2: name[1],
      });
    }

    return typingText;

    // let name = this.guid;

    // if (this.profile) {
    //   const handle = this.profile.get('handle');
    //   if (handle) name = `@${handle}`;
    // }

    // const usernameHtml = `<span class="typingUsername noOverflow">${name}</span>`;
    // return app.polyglot.t('chat.conversation.typingIndicator', { user: usernameHtml });
  }

  setTypingIndicator() {
    this.$typingIndicator.html(this.getTypingIndicatorContent());
  }

  get $typingIndicator() {
    return this._$typingIndicator ||
      (this._$typingIndicator = this.$('.js-typingIndicator'));
  }

  get $messagesOverlay() {
    return this._$messagesOverlay ||
      (this._$messagesOverlay = this.$('.js-messagesOverlay'));
  }

  get $loadMessagesError() {
    let returnVal;

    if (this._$loadMessagesError && this._$loadMessagesError.length) {
      returnVal = this._$loadMessagesError;
    } else {
      returnVal = (this._$loadMessagesError = this.$('.js-loadMessagesError'));
    }

    return returnVal;
  }

  get $convoMessagesWindow() {
    return this._$convoMessagesWindow ||
      (this._$convoMessagesWindow = this.$('.js-convoMessagesWindow'));
  }

  get $btnSend() {
    return this._$btnSend ||
      (this._$btnSend = this.$('.js-btnSend'));
  }

  get $inputMessage() {
    return this._$inputMessage ||
      (this._$inputMessage = this.$('.js-inputMessage'));
  }

  render() {
    loadTemplate('modals/orderDetail/discussion.html', (t) => {
      this.$el.html(t({
        showLoadMessagesError: this.showLoadMessagesError,
        typingIndicator: this.getTypingIndicatorContent(),
        maxMessageLength: ChatMessage.max.messageLength,
        ownProfile: app.profile.toJSON(),
      }));

      this._$subMenu = null;
      this._$messagesOverlay = null;
      this._$loadMessagesError = null;
      this._$convoMessagesWindow = null;
      this._$typingIndicator = null;
      this._$btnSend = null;
      this._$msgInput = null;

      if (this.ConvoMessages) this.ConvoMessages.remove();
      this.convoMessages = new ConvoMessages({
        collection: this.messages,
        $scrollContainer: this.$convoMessagesWindow,
        buyer: this.buyer,
        vendor: this.vendor,
        moderator: this.moderator,
      });
      this.$('.js-convoMessagesContainer').html(this.convoMessages.render().el);
      this.throttleScrollHandler();
    });

    return this;
  }
}
