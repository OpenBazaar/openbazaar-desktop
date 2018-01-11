import $ from 'jquery';
import _ from 'underscore';
import { remote } from 'electron';
import '../../utils/lib/velocity';
import app from '../../app';
import { getBody } from '../../utils/selectors';
import { isScrolledIntoView } from '../../utils/dom';
import { getSocket } from '../../utils/serverConnect';
import { setUnreadChatMsgCount, launchNativeNotification } from '../../utils/notification';
import { events as blockEvents } from '../../utils/block';
import { isHiRez } from '../../utils/responsive';
import loadTemplate from '../../utils/loadTemplate';
import Profile, { getCachedProfiles } from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ChatHeads from './ChatHeads';
import Conversation from './Conversation';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat heads collection.');
    }

    if (!options.$scrollContainer) {
      throw new Error('Please provide a jQuery object containing the scrollable element ' +
        'this view is in.');
    }

    super(options);

    this._isOpen = false;
    this.$scrollContainer = options.$scrollContainer;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);
    this.debouncedOnProfileFetchScroll = _.debounce(this.onProfileFetchScroll, 200).bind(this);
    this.profileDeferreds = {};
    this.fetching = false;
    this.fetchError = false;

    this.listenTo(this.collection, 'sync', () => {
      this.fetching = false;
      this.fetchError = false;
      this.render();
    });

    this.listenTo(this.collection, 'request', () => {
      clearTimeout(this.fakeErrorLatencyTimeout);
      this.fetching = true;
      this.fetchError = false;
      this.render();
    });

    this.listenTo(this.collection, 'error', (cl, resp) => {
      this.fakeErrorLatencyTimeout = setTimeout(() => {
        this.fetching = false;
        this.fetchError = true;
        this.fetchErrorMessage = resp.responseJSON && resp.responseJSON.reason || '';
        this.render();
      }, 300);
    });

    this.listenTo(this.collection, 'remove', md => {
      if (this.conversation && md.get('peerId') === this.conversation.guid) {
        this.conversation.close();
        this.conversation.remove();
        this.conversation = null;

        if (!this.collection.length) {
          this.close();
        }
      }
    });

    this.listenTo(this.collection, 'update change:unread', () => {
      setUnreadChatMsgCount(this.collection.totalUnreadCount);
    });

    this.socket = getSocket();

    if (this.socket) {
      this.listenTo(this.socket, 'message', this.onSocketMessage);
    }

    this.listenTo(blockEvents, 'blocked',
      data => this.collection.remove(data.peerIds));
  }

  className() {
    return 'chat';
  }

  events() {
    return {
      'click .js-topUnreadBanner': 'onClickTopUnreadBanner',
      'click .js-bottomUnreadBanner': 'onClickBottomUnreadBanner',
      'click .js-fetchStateHead': 'onClickFetchStateHead',
      'click .js-retryFetchConvos': 'onClickRetryConvoFetch',
    };
  }

  onChatHeadClick(e) {
    if (!this.isOpen) {
      this.open();
    }

    const profilePromise = this.fetchProfiles([e.view.model.id])[0];
    this._openConversation(e.view.model.id, profilePromise, e.view.model);
  }

  onChatHeadsRendered() {
    if (this.chatHeads.views.length) {
      this.handleUnreadBadge();
    }
  }

  onScroll() {
    this.handleUnreadBadge();
  }

  onProfileFetchScroll() {
    this.fetchProfileOfVisibleChatHeads();
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
        timestamp: msg.timestamp,
        outgoing: msg.outgoing || false,
        unread: msg.outgoing ? 0 : 1,
      };
      const isConvoOpen = this.conversation && this.conversation.guid === msg.peerId &&
        this.conversation.isOpen;

      if (chatHead) {
        if (!msg.outgoing) {
          chatHeadData.unread = document.hasFocus() && isConvoOpen ?
            0 : chatHead.get('unread') + 1;

          if (!document.hasFocus() || !isConvoOpen) {
            const notifOptions = {
              onclick() {
                remote.getCurrentWindow().restore();
                location.hash = `#${msg.peerId}`;
              },
              body: msg.message,
            };
            let handle = '';

            // If the profile is cached, we'll add in some additional data. If it's not,
            // we won't hold up the notification for it to return.
            const profilePromise = getCachedProfiles([msg.peerId])[0];

            if (profilePromise.state() === 'resolved') {
              profilePromise.done(profile => {
                handle = profile.get('handle') || '';
                const avatarHashes = profile.get('avatarHashes') &&
                  profile.get('avatarHashes').toJSON() || {};
                const imageHash = isHiRez ? avatarHashes.medium : avatarHashes.small;

                if (imageHash) {
                  notifOptions.icon = app.getServerUrl(`ob/images/${imageHash}`);
                }
              });
            }

            launchNativeNotification(handle || msg.peerId, notifOptions);
          }

          // Remove any existing chat head so we could put it back in at the top.
          this.collection.remove(chatHead);
        } else {
          chatHeadData.unread = chatHead.get('unread');
        }
      }

      this.collection.add(chatHeadData, {
        at: 0,
        merge: true,
        parse: true,
      });
    }
  }

  onConvoMarkedAsRead(guid) {
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    if (!this.conversation.isOpen) return;

    const chatHead = this.collection.get(guid);

    if (chatHead) chatHead.set('unread', 0);
  }

  onClickFetchStateHead() {
    if (!this.isOpen) {
      this.open();
    }
  }

  onClickRetryConvoFetch() {
    this.collection.fetch();
  }

  /**
   * Outside of this view, please use the "public" openConversation().
   */
  _openConversation(guid, profilePromise) {
    this.open();

    if (this.chatHeads) {
      this.clearActiveChatHead();

      // If there's a chat head, mark it as active
      const chatHeadModel = this.collection.get(guid);

      if (chatHeadModel) {
        this.chatHeads.views[this.collection.indexOf(chatHeadModel)]
          .$el
          .addClass('active');
      }
    }

    if (this.conversation && this.conversation.guid === guid) {
      // In order for the chat head unread count to update properly, be sure to
      // open before marking convo as read.
      this.conversation.open();
      return;
    }

    const oldConvo = this.conversation;

    this.conversation = this.createChild(Conversation, {
      guid,
      profile: profilePromise,
    });

    this.listenTo(this.conversation, 'clickCloseConvo',
      () => this.closeConversation());

    this.listenTo(this.conversation, 'newOutgoingMessage',
      (e) => this.onNewChatMessage(e.model.toJSON()));

    this.listenTo(this.conversation, 'convoMarkedAsRead',
      () => this.onConvoMarkedAsRead(guid));

    this.listenTo(this.conversation, 'deleting',
      (e) => {
        e.request.done(() => this.collection.remove(e.guid));
      });

    this.$chatConvoContainer
      .append(this.conversation.render().el);

    this.conversation.open();

    if (oldConvo) oldConvo.remove();
  }

  openConversation(guid, profile) {
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    if (typeof profile !== 'undefined' &&
      !(profile instanceof Profile)) {
      throw new Error('If providing a profile, it must be an instance of the profile model.');
    }


    let profilePromise;

    if (profile) {
      // If the profile model is provided, we'll turn it into a deferred.
      const deferred = $.Deferred();
      this.profileDeferreds[guid] = deferred;
      deferred.resolve(profile);
      profilePromise = deferred.promise();
    } else {
      // If not providing the profile, we'll fetch it.
      profilePromise = this.fetchProfiles([guid])[0];
    }

    this._openConversation(guid, profilePromise);
  }

  closeConversation() {
    this.clearActiveChatHead();
    if (this.conversation) this.conversation.close();
  }

  clearActiveChatHead() {
    if (this.chatHeads) {
      this.chatHeads.views
        .forEach(chatHead => chatHead.$el.removeClass('active'));
    }
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

  /**
   * This chat view, may need to know when it becomes visible,
   * so please show it via this method.
   */
  show() {
    this.$el.removeClass('hide');
    return this;
  }

  hide() {
    this.$el.addClass('hide');
    return this;
  }

  /**
   * This chat view mey need to know when it is attached to the dom,
   * so please use this method to do so.
   */
  attach(container) {
    if (!container || !(container instanceof $ && container[0] instanceof HTMLElement)) {
      throw new Error('Please provide a container as a jQuery object or DOM element.');
    }

    $(container).append(this.el);
    this.fetchProfileOfVisibleChatHeads();

    return this;
  }

  /**
   * Adds css classes to our scroll element indicating whether the unread messages
   * badges (top and / or bottom) need to be shown.
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

  fetchProfiles(peerIds) {
    if (!Array.isArray(peerIds)) {
      throw new Error('Please provide a list of peerIds.');
    }

    if (!peerIds.length) {
      throw new Error('Please provide at least one peerId');
    }

    const profilePromises = getCachedProfiles(peerIds);

    profilePromises.forEach(profileFetch => {
      profileFetch.done(profile => this.chatHeads.setProfile(profile));
    });

    return profilePromises;
  }

  fetchProfileOfVisibleChatHeads() {
    if (!this.chatHeads || !this.chatHeads.views.length) return;
    this.chatHeadProfilesFetched = this.chatHeadProfilesFetched || [];

    // Find which heads are in the viewport and filter out any that have already
    // had or are having their profiles fetched.
    const profilesToFetch = this.chatHeads.views.filter(chatHead => {
      const peerId = chatHead.model.get('peerId');
      const alreadyFetched = this.chatHeadProfilesFetched.indexOf(peerId) > -1;
      return !alreadyFetched && isScrolledIntoView(chatHead.el);
    }).map(chatHead => (chatHead.model.get('peerId')));

    if (profilesToFetch.length) {
      this.chatHeadProfilesFetched.concat(profilesToFetch);
      this.fetchProfiles(profilesToFetch);
    }
  }

  get $chatConvoContainer() {
    return this._$chatConvoContainer ||
      (this._$chatConvoContainer = $('#chatConvoContainer'));
  }

  remove() {
    clearTimeout(this.fakeErrorLatencyTimeout);
    super.remove();
  }

  render() {
    loadTemplate('chat/chat.html', (t) => {
      this.$el.html(t({
        fetching: this.fetching,
        fetchError: this.fetchError,
        fetchErrorMessage: this.fetchErrorMessage,
      }));

      if (this.chatHeads) this.chatHeads.remove();
      this.chatHeads = this.createChild(ChatHeads, {
        collection: this.collection,
        $scrollContainer: this.$scrollContainer,
      });

      this.listenTo(this.chatHeads, 'chatHeadClick', this.onChatHeadClick);
      this.listenTo(this.chatHeads, 'rendered', this.onChatHeadsRendered);

      // It is important that both of the following occur before the chatHeads
      // view is rendered:
      // - the 'rendered' event is bound
      // - the chatHeads view's el is added to the DOM
      //
      // This is important because handleUnreadBadge() needs the chatHead elements
      // to be visible in the DOM for it to work properly.
      this.listenTo(this.chatHeads, 'rendered', this.onChatHeadsRendered);
      this.$('.js-chatHeadsContainer')
        .html(this.chatHeads.el);
      this.chatHeads.render();

      this.$scrollContainer.off('scroll', this.throttledOnScroll)
        .on('scroll', this.throttledOnScroll);

      this.$scrollContainer.off('scroll', this.debouncedOnProfileFetchScroll)
        .on('scroll', this.debouncedOnProfileFetchScroll);

      this.fetchProfileOfVisibleChatHeads();
    });

    return this;
  }
}
