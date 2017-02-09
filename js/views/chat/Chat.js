// import $ from 'jquery';
// import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

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

  render() {
    loadTemplate('chat/chat.html', (t) => {
      this.$el.html(t({
        // ...this.model.toJSON(),
        // ...this._state,
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
