import _ from 'underscore';
import moment from 'moment';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a Transaction model.');
    }

    this._state = {
      ...options.initialState || {},
    };

    this.listenTo(this.model, 'change', this.render());
  }

  className() {
    return 'transaction';
  }

  // events() {
  //   return {
  //     'click .js-retryFetch': 'onClickRetryFetch',
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
    loadTemplate('modals/wallet/transaction.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        userCurrency: app.settings.get('localCurrency'),
        moment,
        isTestnet: !!app.testnet,
      }));
    });

    return this;
  }
}
