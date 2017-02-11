// import $ from 'jquery';
// import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);

    // this._state = {
    //   status: 'not-connected',
    //   ...options.initialState || {},
    // };
  }

  className() {
    return 'chatHead';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick() {
    this.trigger('click', { view: this });
  }

  // remove() {
  //   super.remove();
  // }

  render() {
    loadTemplate('chat/chatHead.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        // ...this._state,
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
