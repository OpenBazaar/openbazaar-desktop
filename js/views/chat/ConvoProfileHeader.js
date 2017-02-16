import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      status: 'not-connected',
      ...options.initialState || {},
    };
  }

  className() {
    return 'flexVCent gutterH convoProfileHeader';
  }

  events() {
    return {
      // 'click .js-closeConvo': 'onClickCloseConvo',
    };
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = {
        ...this._state,
        ...state,
      };
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  // remove() {
  //   super.remove();
  // }

  render() {
    loadTemplate('chat/convoProfileHeader.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
