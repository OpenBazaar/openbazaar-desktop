/*
  This table is re-used for Sales, Purchases and Cases.
*/

import app from '../../../app';
import $ from 'jquery';
import _ from 'underscore';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { getSocket } from '../../../utils/serverConnect';
import { getContentFrame } from '../../../utils/selectors';
import Order from '../../../models/order/Order';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import OrderDetail from '../../modals/orderDetail/OrderDetail';
import Row from './Row';
import PageControls from '../../components/PageControls';

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
    this.curPage = 1;
    this.queryTotal = null;

    this.listenTo(this.collection, 'update', this.onCollectionUpdate);

    this.socket = getSocket();
    if (this.socket) {
      this.listenTo(this.socket, 'message', this.onSocketMessage);
    }

    this.fetchTransactions();
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

  onClickRow(e) {
    const order = new Order({
      orderId: e.view.model.id,
    });

    const orderDetail = new OrderDetail({
      model: order,
      removeOnClose: true,
    });

    this.listenTo(orderDetail.model, 'sync', () => (e.view.model.set('read', true)));
    orderDetail.render().open();
  }

  onClickNextPage() {
    this.curPage++;
    this.fetchTransactions();
  }

  onClickPrevPage() {
    this.curPage--;
    this.fetchTransactions();
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
              this.indexedViews[e.jsonData.peerId].model
                .set('vendorHandle', e.jsonData.profile.handle);
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

  get transactionsPerPage() {
    return 5;
  }

  fetchTransactions(page = this.curPage) {
    if (typeof page !== 'number') {
      throw new Error('Please provide a page number to fetch.');
    }

    if (page < 1) {
      throw new Error('Please provide a page number greater than zero.');
    }

    if (this.transactionsFetch) this.transactionsFetch.abort();

    const fetchParams = {
      limit: this.transactionsPerPage,
    };

    let havePage = false;

    if (this.collection.length > (page - 1) * this.transactionsPerPage) {
      // we already have the page
      havePage = true;
      getContentFrame()[0].scrollTop = 0;
      this.render();
    } else {
      if (this.collection.length < (page - 1) * this.transactionsPerPage) {
        // You cannot fetch a page unless you have its previous page. The api
        // requires the ID of the last transaction in the previous page.
        throw new Error('Cannot fetch page. Do no have the previous pages.');
      } else if (this.collection.length) {
        fetchParams.offsetId = this.collection.at(this.collection.length - 1).id;
      }
    }

    if (havePage) return;

    this.purchasesFetch = this.collection.fetch({
      data: fetchParams,
      remove: false,
    });

    this.purchasesFetch.fail((jqXhr) => {
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
    }).done((data) => {
      if (this.isRemoved()) return;
      if (page === 1) {
        this.queryTotal = data.queryCount;
      }

      this.setState({
        isFetching: false,
      });
    });

    this.setState({
      isFetching: true,
      fetchFailed: false,
      fetchError: '',
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
    if (this.transactionsFetch) this.transactionsFetch.abort();
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

    const startIndex = (this.curPage - 1) * this.transactionsPerPage;
    this.views.forEach(view => view.remove());
    this.views = [];
    this.indexedViews = {};
    const transactionsFrag = document.createDocumentFragment();
    // The collection contains all pages we've fetched, but we'll slice it and
    // only render the current page.
    this.collection
      .slice(startIndex, startIndex + this.transactionsPerPage)
      .forEach(transaction => {
        const view = this.createChild(Row, {
          model: transaction,
          type: this.type,
        });

        this.listenTo(view, 'clickAcceptOrder', this.onClickAcceptOrder);
        this.listenTo(view, 'clickCancelOrder', this.onClickCancelOrder);
        this.listenTo(view, 'clickRow', this.onClickRow);

        $(transactionsFrag).append(view.render().el);
        this.views.push(view);
      });

    this.indexRowViews();
    this.$('.js-transactionsTable').append(transactionsFrag);

    const onLastPage = this.curPage > this.collection.length / this.transactionsPerPage;
    let end = this.curPage * this.transactionsPerPage;

    if (onLastPage) {
      end = this.collection.length;
    }

    if (this.pageControls) this.pageControls.remove();
    this.pageControls = this.createChild(PageControls, {
      initialState: {
        start: startIndex + 1,
        end,
        total: this.queryTotal,
      },
    });
    this.listenTo(this.pageControls, 'clickNext', this.onClickNextPage);
    this.listenTo(this.pageControls, 'clickPrev', this.onClickPrevPage);
    this.$('.js-pageControlsContainer').html(this.pageControls.render().el);

    return this;
  }
}
