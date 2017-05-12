import app from '../../../app';
import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import Case from '../../../models/order/Case';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        fetchFailed: false,
        fetchError: '',
      },
      ...options,
    };

    super(opts);
    this.options = opts;

    if (!this.model) {
      throw new Error('Please provide an Order model.');
    }

    this.listenTo(this.model, 'request', this.onOrderRequest);
    this.model.fetch();
  }

  className() {
    return `${super.className()} modalScrollPage tabbedModal orderDetail`;
  }

  events() {
    return {
      'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      'click .js-retryFetch': 'onClickRetryFetch',
      'click .js-returnBox': 'onClickReturnBox',
      ...super.events(),
    };
  }

  onOrderRequest(md, xhr) {
    this.setState({
      isFetching: true,
      fetchError: '',
      fetchFailed: false,
    });

    xhr.done(() => {
      this.setState({
        isFetching: false,
        fetchFailed: false,
      });
    }).fail((jqXhr) => {
      if (jqXhr.statusText === 'abort') return;

      let fetchError = '';

      if (jqXhr.responseJSON && jqXhr.responseJSON.reason) {
        fetchError = jqXhr.responseJSON.reason;
      }

      this.setState({
        isFetching: false,
        fetchFailed: true,
        fetchError,
      });
    });
  }

  onClickRetryFetch() {
    this.model.fetch();
  }

  onClickReturnBox() {
    this.close();
  }

  get type() {
    return this.model instanceof Case ? 'case' : this.model.type;
  }

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

  remove() {
    super.remove();
  }

  render() {
    loadTemplate('modals/orderDetail.html', t => {
      this.$el.html(t({
        id: this.model.id,
        ...this._state,
        ...this.model.toJSON(),
        ownProfile: app.profile.toJSON(),
        returnText: this.options.returnText,
        type: this.type,
      }));
      super.render();
    });

    return this;
  }
}
