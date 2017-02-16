// import $ from 'jquery';
// import _ from 'underscore';
import Profile from '../../models/profile/Profile';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

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
      // this.profile.done(() => {});
    }

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };
  }

  className() {
    return 'chatConversation clrP';
  }

  events() {
    return {
      // click: 'onClick',
    };
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
    });

    return this;
  }
}
