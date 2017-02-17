import $ from 'jquery';
// import _ from 'underscore';
import Profile from '../../models/profile/Profile';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import ConvoProfileHeader from './ConvoProfileHeader';

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

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };
  }

  className() {
    return 'chatConversation flexColRows clrP';
  }

  events() {
    return {
      click: 'onViewClick',
      'click .js-closeConvo': 'onClickCloseConvo',
      'click .js-subMenuTrigger': 'onClickSubMenuTrigger',
      'click .js-blockUser': 'onClickBlockUser',
      'click .js-subMenu a': 'onClickSubMenuLink',
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

  // remove() {
  //   super.remove();
  // }

  get $subMenu() {
    return this._$subMenu ||
      (this._$subMenu = this.$('.js-subMenu'));
  }

  get $messagesOverlay() {
    return this._$messagesOverlay ||
      (this._$messagesOverlay = this.$('.js-messagesOverlay'));
  }

  render() {
    loadTemplate('chat/conversation.html', (t) => {
      this.$el.html(t({
        // ...this.model.toJSON(),
        guid: this.guid,
        chatHead: this.chatHead && this.chatHead.toJSON() || {},
        profile: this.profile && this.profile.toJSON() || {},
        // ...this._state,
      }));

      this._$subMenu = null;
      this._$messagesOverlay = null;

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
    });

    return this;
  }
}
