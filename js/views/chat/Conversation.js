import $ from 'jquery';
import _ from 'underscore';
import app from '../../app';
import { getBody } from '../../utils/selectors';
import { getCurrentConnection } from '../../utils/serverConnect';
import loadTemplate from '../../utils/loadTemplate';
import ChatMessages from '../../collections/ChatMessages';
import ChatMessage from '../../models/chat/ChatMessage';
import Profile from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ConvoProfileHeader from './ConvoProfileHeader';
import ConvoMessages from './ConvoMessages';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.profile ||
      (!(options.profile instanceof Profile) &&
      !options.profile.then)) {
      throw new Error('Please provide a profile model or a promise that provides' +
        ' one when it resolves.');
    }

    if (!options.guid) {
      throw new Error('Please provide the GUID of the person you are conversing with.');
    }

    const opts = {
      subject: '',
      ...options,
    };

    super(opts);

    this.options = opts;
    this._guid = this.options.guid;
    this.subject = '';
    this.showLoadMessagesError = false;
    this.fetching = false;
    this.fetchedAllMessages = false;
    this.ignoreScroll = false;
    this.throttledScroll = _.throttle(this.onScroll, 100).bind(this);

    if (this.options.chatHead) {
      this.chatHead = this.options.chatHead;
    }

    if (options.profile instanceof Profile) {
      this.profile = this.options.profile;
    } else {
      options.profile.done(model => {
        this.profile = model;

        if (this.convoProfileHeader) {
          this.convoProfileHeader.setState({
            handle: model.get('handle'),
            avatarHashes: model.get('avatarHashes'),
          });
        }
      });
    }

    this.messages = new ChatMessages([], { guid: this.guid });
    this.listenTo(this.messages, 'request', this.onMessagesRequest);
    this.listenTo(this.messages, 'sync', this.onMessagesSync);
    this.listenTo(this.messages, 'update', this.onMessagesUpdate);
    this.listenTo(this.messages, 'error', this.onMessagesFetchError);
    this.fetchMessages();

    const serverConnection = getCurrentConnection();

    if (serverConnection && serverConnection.status !== 'disconnected') {
      this.listenTo(serverConnection.socket, 'message', this.onSocketMessage);
    } else {
      // There's no connection to the server. The connection modal will appear and
      // a subsequent reconnect will re-start the app.
    }
  }

  get messagesPerPage() {
    // TODO: set to 25 or so after dev complete!!!
    return 5;
  }

  className() {
    return 'chatConversation flexColRows clrP noMessages';
  }

  events() {
    return {
      click: 'onViewClick',
      'click .js-closeConvo': 'onClickCloseConvo',
      'click .js-subMenuTrigger': 'onClickSubMenuTrigger',
      'click .js-blockUser': 'onClickBlockUser',
      'click .js-subMenu a': 'onClickSubMenuLink',
      'click .js-retryLoadMessage': 'onClickRetryLoadMessage',
      'keyup .js-inputMessage': 'onKeyUpMessageInput',
    };
  }

  onClickCloseConvo() {
    this.trigger('clickCloseConvo');
  }

  onClickSubMenuTrigger() {
    if (this.isSubmenuOpen()) {
      this.hideSubMenu();
    } else {
      this.showSubMenu();
    }

    return false; // don't bubble to onViewClick
  }

  onViewClick(e) {
    if (!$(e.target).closest('.js-subMenu').length) {
      this.hideSubMenu();
    }
  }

  onClickBlockUser() {
    alert('coming soon...');
  }

  onClickSubMenuLink() {
    this.hideSubMenu();
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
      this.setScrollTop(this.$convoMessagesWrap[0].scrollHeight);
      this.markConvoAsRead();
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

    prevScroll.height = this.$convoMessagesWrap[0].scrollHeight;
    prevScroll.top = this.$convoMessagesWrap[0].scrollTop;

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
          this.setScrollTop(this.$convoMessagesWrap[0].scrollHeight);
        } else if (prevScroll.top >=
          prevScroll.height - this.$convoMessagesWrap[0].clientHeight - 10) {
          // For an incoming message, if we were scrolled within 10px of the bottom at the
          // time the message came, we'll auto-scroll. Otherwise, we'll leave you where you were.
          this.setScrollTop(this.$convoMessagesWrap[0].scrollHeight);
        }
      }
    } else if (opts.changes.added.length &&
      cl.indexOf(opts.changes.added[opts.changes.added.length - 1]) !==
      prevTopModel) {
      // New page of messages added up top. We'll adjust the scroll position so there is no
      // jump as they are added in.
      this.setScrollTop(prevScroll.top +
        (this.$convoMessagesWrap[0].scrollHeight - prevScroll.height - 60));

      // the hardcode 60 is to account for the loading spinner that is going away
    }
  }

  onClickRetryLoadMessage() {
    this.fetchMessages(...this.lastFetchMessagesArgs);
  }

  onKeyUpMessageInput(e) {
    if (e.which !== 13) return;

    const message = e.target.value.trim();

    if (!message) return;

    const chatMessage = new ChatMessage({
      peerId: this.guid,
      message,
    });

    const save = chatMessage.save();

    if (save) {
      // At least for now, ignoring any server failures and optimistically adding the new
      // message to the UI. Odds are really low of server failure and repurcussions minimal.
      this.messages.push(chatMessage);
      this.trigger('newOutgoingMessage', { model: chatMessage });
    } else {
      // Developer error - this shouldn't happen.
      console.error('There was an error saving the chat message.');
      console.dir(save);
    }

    $(e.target).val('');
  }

  onScroll(e) {
    if (this.ignoreScroll) {
      this.ignoreScroll = false;
      return;
    }

    if (this.fetching || this.fetchedAllMessages
      || this.showLoadMessagesError) return;

    // If we come close enough to the top, let's fetch a new page.
    if (e.target.scrollTop <= 50) {
      this.fetchMessages(this.messages.at(0).id);
    }
  }

  onSocketMessage(e) {
    const msg = e.jsonData.message;

    if (msg && msg.subject === this.subject) {
      const message = new ChatMessage({
        ...msg,
        outgoing: false,
      });

      this.messages.push(message);
      this.markConvoAsRead();
    }
  }

  fetchMessages(offsetId, limit = this.messagesPerPage) {
    const params = { limit };

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

    if (this.$convoMessagesWrap[0].scrollTop === value) return;

    if (silent) this.ignoreScroll = true;

    this.$convoMessagesWrap[0].scrollTop = value;
  }

  markConvoAsRead() {
    const queryString = this.subject ? `/?subject=${this.subject}` : '';
    $.post(app.getServerUrl(`ob/markchatasread/${this.guid}${queryString}`));
    this.trigger('convoMarkedAsRead');
  }

  get guid() {
    return this._guid;
  }

  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    getBody().addClass('chatConvoOpen');
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    getBody().removeClass('chatConvoOpen');
  }

  get isOpen() {
    return this._isOpen;
  }

  isSubmenuOpen() {
    return !this.$subMenu.hasClass('hide');
  }

  showSubMenu() {
    this.$messagesOverlay.removeClass('hide');
    this.$subMenu.removeClass('hide');
  }

  hideSubMenu() {
    this.$messagesOverlay.addClass('hide');
    this.$subMenu.addClass('hide');
  }

  get $subMenu() {
    return this._$subMenu ||
      (this._$subMenu = this.$('.js-subMenu'));
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

  get $convoMessagesWrap() {
    return this._$convoMessagesWrap ||
      (this._$convoMessagesWrap = this.$('.js-convoMessagesWrap'));
  }

  render() {
    loadTemplate('chat/conversation.html', (t) => {
      this.$el.html(t({
        guid: this.guid,
        chatHead: this.chatHead && this.chatHead.toJSON() || {},
        profile: this.profile && this.profile.toJSON() || {},
        showLoadMessagesError: this.showLoadMessagesError,
      }));

      this._$subMenu = null;
      this._$messagesOverlay = null;
      this._$loadMessagesError = null;
      this._$convoMessagesWrap = null;

      if (this.convoProfileHeader) this.convoProfileHeader.remove();

      const convoProfileHeaderInitialState = {
        guid: this.guid,
      };

      if (this.profile) {
        convoProfileHeaderInitialState.handle = this.profile.get('handle');
        convoProfileHeaderInitialState.avatarHashes = this.profile.get('avatarHashes');
      }

      this.convoProfileHeader = this.createChild(ConvoProfileHeader, {
        initialState: convoProfileHeaderInitialState,
      });

      this.$('.js-convoProfileHeaderContainer')
        .html(this.convoProfileHeader.render().el);

      if (this.ConvoMessages) this.ConvoMessages.remove();

      this.convoMessages = new ConvoMessages({
        collection: this.messages,
        $scrollContainer: this.$convoMessagesWrap,
      });

      this.$('.js-convoMessagesContainer').html(this.convoMessages.render().el);

      this.$convoMessagesWrap.on('scroll', this.throttledScroll);
    });

    return this;
  }
}
