import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
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
    return `${super.className()} modalScrollPage modalMedium orderDetail`;
  }

  events() {
    return {
      'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      'click .js-retryFetch': 'onClickRetryFetch',
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
      }));
      super.render();
    });

    return this;
  }
}
