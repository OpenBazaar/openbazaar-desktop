import $ from 'jquery';
import _ from 'underscore';
import '../../utils/velocity';
import app from '../../app';
import { getBody } from '../../utils/selectors';
import { isScrolledIntoView } from '../../utils/dom';
import { getSocket } from '../../utils/serverConnect';
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

    this.socket = getSocket();

    if (this.socket) {
      this.listenTo(this.socket, 'message', this.onSocketMessage);
    }
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
    } else {
      const profilePromise = this.fetchProfile(e.view.model.id);
      this._openConversation(e.view.model.id, profilePromise, e.view.model);
    }
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
        outgoing: false,
        unread: 1,
      };

      if (this.conversation && this.conversation.guid === msg.peerId &&
        this.conversation.isOpen) {
        chatHeadData.unread = 0;
      }

      if (chatHead) {
        if (!(this.conversation && this.conversation.guid === msg.peerId &&
          this.conversation.isOpen)) {
          chatHeadData.unread = chatHead.get('unread') + 1;
        }

        this.collection.remove(chatHead);
      }

      this.collection.add(chatHeadData, {
        at: 0,
        merge: true,
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
    if (this.conversation && this.conversation.guid === guid) {
      // In order for the chat head unread count to update properly, be sure to
      // open before marking convo as read.
      this.conversation.open();

      if (this.collection.get(guid) && this.collection.get(guid).get('unread') &&
        this.conversation.messages.length) {
        this.conversation.markConvoAsRead();
      }

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
        e.request.done(() => {
          this.collection.remove(e.guid);

          if (this.conversation && this.conversation.guid === e.guid) {
            this.conversation.remove();
            this.conversation = null;
          }
        });
      });

    this.$chatConvoContainer
      .append(this.conversation.render().el);

    this.conversation.open();
    this.open();

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
      // If the profile model is provided, well turn it into a deferred.
      const deferred = $.Deferred();
      this.profileDeferreds[guid] = deferred;
      deferred.resolve(profile);
      profilePromise = deferred.promise();
    } else {
      // If not providing the profile, we'll fetch it.
      profilePromise = this.fetchProfile(guid);
    }

    this._openConversation(guid, profilePromise);
  }

  closeConversation() {
    if (this.conversation) this.conversation.close();
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

  /**
   * Will return a promise that resolves to a Profile. If we have already
   * fetched or are in the promise of fetching a Profile, then the
   * existing promise will be returned.
   */
  fetchProfile(guid) {
    if (!guid) {
      throw new Error('Please provide a guid.');
    }

    const profileDeferred = this.profileDeferreds[guid];
    let returnVal = profileDeferred;

    if (!profileDeferred) {
      this.fetchProfiles([guid]);
      returnVal = this.profileDeferreds[guid];
    }

    return returnVal.promise();
  }

  /**
   * Will asynchronously (profiles returned via sockets) fetch the provided
   * list of profiles and update the this.profileDeferreds. Will not refetch
   * profiles that have already been fetched or are in the process of being
   * fetched.
   */
  fetchProfiles(profiles) {
    if (!_.isArray(profiles)) {
      throw new Error('Please provide a list of profiles.');
    }

    const profilesToFetch = [];

    if (profiles.length) {
      profiles.forEach(profileId => {
        if (!this.profileDeferreds[profileId]) {
          const deferred = $.Deferred();
          this.profileDeferreds[profileId] = deferred;
          profilesToFetch.push(profileId);
        }
      });

      $.post({
        url: app.getServerUrl('ob/fetchprofiles?async=true'),
        data: JSON.stringify(profilesToFetch),
        dataType: 'json',
        contentType: 'application/json',
      }).done((data) => {
        if (this.socket) {
          this.listenTo(this.socket, 'message', (e) => {
            if (e.jsonData.id === data.id) {
              const profile = new Profile(e.jsonData.profile, { parse: true });
              this.profileDeferreds[e.jsonData.peerId].resolve(profile);

              if (this.chatHeads) {
                this.chatHeads.setProfile(e.jsonData.peerId, profile);
              }
            }
          });
        }
      });
    }
  }

  fetchProfileOfVisibleChatHeads() {
    if (!this.chatHeads || !this.chatHeads.views.length) return;

    // Find which heads are in the viewport and filter out any that have already
    // had or are having their profiles fetched.
    const profilesToFetch = this.chatHeads.views.filter(chatHead => (
      !this.profileDeferreds[chatHead.model.get('peerId')] && isScrolledIntoView(chatHead.el)
    )).map(chatHead => (chatHead.model.get('peerId')));

    this.fetchProfiles(profilesToFetch);
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
