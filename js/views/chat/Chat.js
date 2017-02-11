import $ from 'jquery';
// import _ from 'underscore';
import { getBody } from '../../utils/selectors';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import ChatHeads from './ChatHeads';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat conversations collection.');
    }

    super(options);

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };

    this._isOpen = false;

    this.listenTo(this.collection, 'sync', () => {
      console.log('boom selecta');
      window.boom = this.collection;
      this.render();
    });
  }

  className() {
    return 'chat';
  }

  events() {
    return {
      // 'click .js-btnConnect': 'onConnectClick',
    };
  }

  // getState() {
  //   return this._state;
  // }

  // setState(state, replace = false) {
  //   let newState;

  //   if (replace) {
  //     this._state = {};
  //   } else {
  //     newState = _.extend({}, this._state, state);
  //   }

  //   if (!_.isEqual(this._state, newState)) {
  //     this._state = newState;
  //     this.render();
  //   }

  //   return this;
  // }

  // remove() {
  //   super.remove();
  // }

  onChatHeadClick() {
    if (!this.isOpen) {
      this.open();
    }
  }

  open() {
    this._isOpen = true;
    getBody().addClass('chatOpen');
  }

  close() {
    this._isOpen = false;
    getBody().removeClass('chatOpen');
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
        .append(this.chatHeads.render().el);
    });

    return this;
  }
}
