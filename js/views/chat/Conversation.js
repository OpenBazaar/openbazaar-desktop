import $ from 'jquery';
import _ from 'underscore';
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

    super(options);
    this.options = options;
    this._guid = this.options.guid;
    this.showLoadMessagesError = false;
    this.fetching = false;
    this.fetchedAllMessages = false;
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
  }

  get messagesPerPage() {
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

    // this.$convoMessagesWrap.off(null, this.throttledScroll);
    // this.$convoMessagesWrap[0].scrollTop = this.$convoMessagesWrap[0].scrollHeight;
    // this.$convoMessagesWrap.on('scroll', this.throttledScroll);
  }

  onMessagesFetchError() {
    this.showLoadMessagesError = true;
    this.$loadMessagesError.removeClass('hide');
    this.$el.removeClass('loadingMessages');
  }

  onMessagesUpdate() {
    if (this.messages.length) {
      this.$el.removeClass('noMessages');
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
    } else {
      // Developer error - this shouldn't happen.
      console.error('There was an error saving the chat message.');
      console.dir(save);
    }

    $(e.target).val('');
  }

  onScroll(e) {
    console.log('you are scrolling');
    if (this.fetching || this.fetchedAllMessages
      || this.showLoadMessagesError) return;

    console.log('i will process the scroll');

    // If we come within 100px of the top, let's fetch a new page.
    if (e.target.scrollTop <= 100) {
      this.fetchMessages(this.messages.at(0).id);
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

  get guid() {
    return this._guid;
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

      this.$convoMessagesWrap.off(null, this.throttledScroll)
        .on('scroll', this.throttledScroll);
    });

    return this;
  }
}
