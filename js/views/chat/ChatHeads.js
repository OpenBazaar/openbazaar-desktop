// import $ from 'jquery';
// import _ from 'underscore';
// import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import ChatHead from './ChatHead';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat conversations collection.');
    }

    super(options);

    this._chatHeadViews = [];

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };
  }

  className() {
    return 'chatHeads flexColRows gutterVSm';
  }

  events() {
    return {
      // 'click .js-btnConnect': 'onConnectClick',
    };
  }

  // remove() {
  //   super.remove();
  // }

  get views() {
    return this._chatHeadViews;
  }

  render() {
    // loadTemplate('chat/chatHeads.html', (t) => {
    //   this.$el.html(t({
    //     chatHeads: this.collection.toJSON(),
    //     ...this.model.toJSON(),
    //     ...this._state,
    //   }));

    //   this._$deleteConfirm = null;
    // });

    this._chatHeadViews.forEach(vw => vw.remove());
    this._chatHeadViews = [];

    this.collection.forEach(chatHead => {
      const view = this.createChild(ChatHead, { model: chatHead });
      this.listenTo(view, 'click', (...args) => this.trigger('chatHeadClick', ...args));
      this._chatHeadViews.push(view);
      this.$el.append(view.render().el);
    });

    return this;
  }
}
