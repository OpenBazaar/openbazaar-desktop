// import $ from 'jquery';
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
      'click .js-closeConvo': 'onClickCloseConvo',
    };
  }

  onClickCloseConvo() {
    this.trigger('clickCloseConvo');
  }

  get guid() {
    return this._guid;
  }

  // remove() {
  //   super.remove();
  // }

  render() {
    loadTemplate('chat/conversation.html', (t) => {
      this.$el.html(t({
        // ...this.model.toJSON(),
        guid: this.guid,
        chatHead: this.chatHead && this.chatHead.toJSON() || {},
        profile: this.profile && this.profile.toJSON() || {},
        // ...this._state,
      }));

      // this._$deleteConfirm = null;

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
