import $ from 'jquery';
import _ from 'underscore';
import '../../utils/velocity';
import { getBody } from '../../utils/selectors';
import { isScrolledIntoView } from '../../utils/dom';
import { getCurrentConnection } from '../../utils/serverConnect';
import loadTemplate from '../../utils/loadTemplate';
import Profile from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ChatHeads from './ChatHeads';
import Conversation from './Conversation';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat heads collection.');
    }

    super(options);

    this._isOpen = false;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    // TODO: handle fetch error.
    this.listenTo(this.collection, 'sync', () => this.render());

    const serverConnection = getCurrentConnection();

    if (serverConnection && serverConnection.status !== 'disconnected') {
      this.listenTo(serverConnection.socket, 'message', this.onSocketMessage);
    } else {
      // There's no connection to the server. The connection modal will appear and
      // a subsequent reconnect will re-start the app.
    }
  }

  className() {
    return 'chat';
  }

  events() {
    return {
      'click .js-topUnreadBanner': 'onClickTopUnreadBanner',
      'click .js-bottomUnreadBanner': 'onClickBottomUnreadBanner',
    };
  }

  onChatHeadClick(e) {
    if (!this.isOpen) {
      this.open();
    } else {
      const profilePromise = $.Deferred().promise();

      this.openConversation(e.view.model.id, profilePromise, e.view.model);
    }
  }

  openConversation(guid, profile, chatHead) {
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    if (!profile ||
      (!(profile instanceof Profile) &&
      !profile.then)) {
      throw new Error('Please provide a profile model or a promise that provides' +
        ' one when it resolves.');

      // If providing a promise, please pass the Profile instance into the
      // resolve handler, so the following will work:
      // promise.done(profile => { // i gotz me a profile model! });
    }

    // todo: if not chat head, create one.
    if (this.conversation && this.conversation.guid === guid) {
      // In order for the chat head unread count to update properly, be sure to
      // open before marking convo as read.
      this.conversation.open();

      // todo: after chat head logic, update below line.
      if (this.collection.get(guid).get('unread') && this.conversation.messages.length) {
        this.conversation.markConvoAsRead();
      }

      return;

      // For now we'll do nothing. An enhancement could be determining if the existing
      // convo is a.) still waiting on the profile b.) has an older profile than the one
      // provided, and if so update the convo with the given profile.
    }

    const oldConvo = this.conversation;

    this.conversation = this.createChild(Conversation, {
      guid,
      profile,
      chatHead,
    });

    this.listenTo(this.conversation, 'clickCloseConvo',
      () => this.closeConversation());

    this.listenTo(this.conversation, 'newOutgoingMessage',
      (e) => this.onNewChatMessage(e.model.toJSON()));

    this.listenTo(this.conversation, 'convoMarkedAsRead',
      () => this.onConvoMarkedAsRead(guid));

    this.$chatConvoContainer
      .append(this.conversation.render().el);

    this.conversation.open();

    if (oldConvo) oldConvo.remove();
  }

  closeConversation() {
    if (this.conversation) this.conversation.close();
  }

  onScroll() {
    this.handleUnreadBadge();
  }

  onClickTopUnreadBanner() {
    // Find the first chat head with unreads that is out of view above
    // the current viewport and scroll to it so it is positioned at the
    // bottom of the viewport.
    const firstChatHeadAbove = this.chatHeads.views
      .filter(chatHead => (chatHead.model.get('unread')))
      .slice()
      .reverse()
      .find(chatHead => {
        const position = chatHead.$el.position();

        return position.top <= chatHead.el.offsetHeight * -1;
      });

    if (firstChatHeadAbove) {
      firstChatHeadAbove.$el
        .velocity('scroll', {
          container: this.$scrollContainer,
          offset: this.$scrollContainer[0].offsetHeight * -1,
        });
    }
  }

  onClickBottomUnreadBanner() {
    // Find the first chat head with unreads that is out of view below
    // the current viewport and scroll to it.
    const firstChatHeadBelow = this.chatHeads.views
      .filter(chatHead => (chatHead.model.get('unread')))
      .find(chatHead => {
        const position = chatHead.$el.position();

        return position.top >= this.$scrollContainer[0].offsetHeight;
      });

    if (firstChatHeadBelow) {
      firstChatHeadBelow.$el
        .velocity('scroll', { container: this.$scrollContainer });
    }
  }

  onSocketMessage(e) {
    this.onNewChatMessage(e.jsonData.message);
  }

  onNewChatMessage(msg) {
    if (msg && !msg.subject) {
      const chatHead = this.collection.get(msg.peerId);
      const chatHeadData = {
        peerId: msg.peerId,
        lastMessage: msg.message,
        outgoing: false,
        unread: 1,
      };

      if (chatHead) {
        if (this.conversation && this.conversation.guid === msg.peerId &&
          this.conversation.isOpen) {
          chatHeadData.unread = 0;
        } else {
          chatHeadData.unread = chatHead.get('unread') + 1;
        }

        chatHead.set(chatHeadData);
      } else {
        this.collection.add(chatHeadData, { at: 0 });
      }
    }
  }

  onConvoMarkedAsRead(guid) {
    console.log('on that mark that read yo what what');
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    if (!this.conversation.isOpen) return;

    const chatHead = this.collection.get(guid);

    if (chatHead) chatHead.set('unread', 0);
  }

  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    getBody().addClass('chatOpen');
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    getBody().removeClass('chatOpen');
    this.closeConversation();
  }

  get isOpen() {
    return this._isOpen;
  }

  // This chat view, in some cases, needs to know when it becomes visible,
  // so please show it via this method.
  show() {
    this.$el.removeClass('hide');
    return this;
  }

  hide() {
    this.$el.addClass('hide');
    return this;
  }

  // This chat view, in some cases, needs to know when it is attached to the dom,
  // so please use this method to do so.
  attach(container) {
    if (!container || !(container instanceof $ && container[0] instanceof HTMLElement)) {
      throw new Error('Please provide a container as a jQuery object or DOM element.');
    }

    $(container).append(this.el);
    return this;
  }

  /**
   * Adds css classes to our scroll element indicating whether the unread messages
   * badges needs to be shown.
   */
  handleUnreadBadge() {
    if (!this.chatHeads) return;

    const firstUnreadChatHead = this.collection
      .find(chatHead => (chatHead.get('unread')));

    // todo: update isScrolledIntoView so that you could pass in an offset to
    // determine if a certain portion of the el is out of view rather than the
    // whole element

    if (firstUnreadChatHead) {
      const firstUnreadIndex = this.collection.indexOf(firstUnreadChatHead);

      if (!isScrolledIntoView(this.chatHeads.views[firstUnreadIndex].el)) {
        this.$el.addClass('outOfViewUnreadsAbove');
      } else {
        this.$el.removeClass('outOfViewUnreadsAbove');
      }
    } else {
      this.$el.removeClass('outOfViewUnreadsAbove outOfViewUnreadsBelow');
      return;
    }

    const lastUnreadChatHead = this.collection
      .slice()
      .reverse()
      .find(chatHead => (chatHead.get('unread')));

    if (lastUnreadChatHead && lastUnreadChatHead !== firstUnreadChatHead) {
      const lastUnreadIndex = this.collection.indexOf(lastUnreadChatHead);

      if (!isScrolledIntoView(this.chatHeads.views[lastUnreadIndex].el)) {
        this.$el.addClass('outOfViewUnreadsBelow');
      } else {
        this.$el.removeClass('outOfViewUnreadsBelow');
      }
    } else {
      this.$el.removeClass('outOfViewUnreadsBelow');
    }
  }

  get $chatConvoContainer() {
    return this._$chatConvoContainer ||
      (this._$chatConvoContainer = $('#chatConvoContainer'));
  }

  render() {
    loadTemplate('chat/chat.html', (t) => {
      this.$el.html(t({
        // chatHeads: this.collection.toJSON(),
        // ...this.model.toJSON(),
        // ...this._state,
      }));

      // this._$deleteConfirm = null;

      if (this.chatHeads) this.chatHeads.remove();
      this.chatHeads = this.createChild(ChatHeads, {
        collection: this.collection,
      });

      this.listenTo(this.chatHeads, 'chatHeadClick', this.onChatHeadClick);

      this.$('.js-chatHeadsContainer')
        .html(this.chatHeads.render().el);

      // todo: pass in scroll container as a view option
      this.$scrollContainer = $('#chatContainer');
      this.handleUnreadBadge();
      this.$scrollContainer.off('scroll', this.throttledOnScroll)
        .on('scroll', this.throttledOnScroll);
    });

    return this;
  }
}
