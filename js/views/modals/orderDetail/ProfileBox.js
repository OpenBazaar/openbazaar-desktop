import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        fetchFailed: false,
      },
      ...options,
    };

    super(opts);
    this.options = opts;

    if (!this.model) {
      throw new Error('Please provide a Profile model.');
    }

    this._state = {
      ...opts.initialState || {},
    };

    this.listenTo(this.model, 'change', () => this.render());
  }

  className() {
    return 'profileBox';
  }

  // events() {
  //   return {
  //     'click .js-toggleSendReceive': 'onClickToggleSendReceive',
  //   };
  // }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('modals/orderDetail/profileBox.html', t => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
