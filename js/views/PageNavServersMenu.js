import $ from 'jquery';
import _ from 'underscore';
import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a server configurations collection.');
    }

    super(options);

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };

    // this._state = {

    // };

    // this.listenTo(this.model, 'change', () => this.render());
    // $(document).on('click', this.onDocumentClick.bind(this));
  }

  // className() {
  //   return 'configuration';
  // }

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
  //   $(document).off('click', this.onDocumentClick);
  //   super.remove();
  // }

  render() {
    if (!this.rendered) {
      this.rendered = true;
      this.listenTo(this.collection, 'update', this.render);
    }

    loadTemplate('pageNavServersMenu.html', (t) => {
      this.$el.html(t({
        ...this.collection.toJSON(),
      }));
    });

    return this;
  }
}
