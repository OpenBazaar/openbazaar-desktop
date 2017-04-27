/*
  This table is re-used for Sales, Purchases and Cases.
*/

import app from '../../../app';
import $ from 'jquery';
import _ from 'underscore';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { getSocket } from '../../../utils/serverConnect';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import Row from './Row';

export default class extends baseVw {
  constructor(options = {}) {
    const types = ['sales', 'purchases', 'cases'];
    const opts = {
      initialState: {
        isFetching: false,
        fetchError: '',
      },
      type: 'sales',
      ...options,
    };

    if (types.indexOf(opts.type) === -1) {
      throw new Error('Please provide a valid type.');
    }

    if (opts.type === 'sales' && typeof opts.acceptingOrder !== 'function') {
      // The function should accept an orderId and return a promise if it
      // is in the process of being accepted, otherwise false.
      throw new Error('Please provide a function to determine if a given order is in the process ' +
        'of being accepted.');
    }

    if (opts.type === 'sales' && typeof opts.acceptOrder !== 'function') {
      // The function should accept an orderId and return a promise.
      throw new Error('Please provide a function to accept an order.');
    }

    if (opts.type === 'purchases' && typeof opts.cancelingOrder !== 'function') {
      // The function should accept an orderId and return a promise if it
      // is in the process of being canceled, otherwise false.
      throw new Error('Please provide a function to determine if a given order is in the process ' +
        'of being canceled.');
    }

    if (opts.type === 'purchases' && typeof opts.cancelOrder !== 'function') {
      // The function should accept an orderId and return a promise.
      throw new Error('Please provide a function to cancel an order.');
    }

    super(opts);

    if (!this.collection) {
      throw new Error('Please provide a collection');
    }

    this.options = opts;
    this.type = opts.type;
    this._state = {
      ...opts.initialState || {},
    };
    this.views = [];

    this.listenTo(this.collection, 'update', this.onCollectionUpdate);

    this.socket = getSocket();

    if (this.socket) {
      this.listenTo(this.socket, 'message', this.onSocketMessage);
    }
  }

  className() {
    return 'transactionsTableWrap';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  onClickRetryFetch() {
    this.trigger('retryFetchClick');
  }

  onClickAcceptOrder() {
    // this is needed for sales
  }

  onClickCancelOrder(e) {
    this.options.cancelOrder(e.view.model.id)
      .always(() => {
        e.view.setState({
          cancelOrderInProgress: false,
        });
      })
      .done(() => {
        e.view.model.set('state', 'CANCELED');
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('transactions.purchases.failedCancelHeading'),
          failReason
        );
      });

    e.view.setState({
      cancelOrderInProgress: true,
    });
  }

  onCollectionUpdate(cl, opts) {
    this.getAvatars(opts.changes.added || {});
  }

  getAvatars(models = []) {
    const profilesToFetch = [];

    models.forEach(md => {
      if (this.type === 'purchases') {
        profilesToFetch.push(md.get('vendorId'));
      }
    });

    this.avatarPost = $.post({
      url: app.getServerUrl('ob/fetchprofiles?async=true&usecache=true'),
      data: JSON.stringify(profilesToFetch),
      dataType: 'json',
      contentType: 'application/json',
    }).done((data) => {
      if (this.socket) {
        this.listenTo(this.socket, 'message', (e) => {
          if (e.jsonData.id === data.id) {
            if (this.type === 'purchases') {
              this.indexedViews[e.jsonData.peerId].setState({
                vendorAvatarHashes: e.jsonData.profile.avatarHashes,
              });
            }
          }
        });
      }
    });
  }

  /*
   * Index the Row Views by Vendor and/or Buyer ID so avatar hashes
   * received via the socket can be correctly applied to them.
   */
  indexRowViews() {
    this.indexedViews = {};
    this.views.forEach(view => {
      if (this.type === 'purchases') {
        this.indexedViews[view.model.get('vendorId')] = view;
      }
    });
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
    if (this.avatarPost) this.avatarPost.abort();
    super.remove();
  }

  render() {
    loadTemplate('transactions/table/table.html', (t) => {
      this.$el.html(t({
        type: this.type,
        transactions: this.collection.toJSON(),
        ...this._state,
      }));
    });

    this.views.forEach(view => view.remove());
    this.views = [];
    this.indexedViews = {};
    const transactionsFrag = document.createDocumentFragment();
    this.collection.forEach(transaction => {
      const view = this.createChild(Row, {
        model: transaction,
        type: this.type,
      });

      this.listenTo(view, 'clickAcceptOrder', this.onClickAcceptOrder);
      this.listenTo(view, 'clickCancelOrder', this.onClickCancelOrder);

      $(transactionsFrag).append(view.render().el);
      this.views.push(view);
    });

    this.indexRowViews();
    this.$('.js-transactionsTable').append(transactionsFrag);

    return this;
  }
}
