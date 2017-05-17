/*
  This table is re-used for Sales, Purchases and Cases.
*/

import app from '../../../app';
import $ from 'jquery';
import _ from 'underscore';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { getContentFrame } from '../../../utils/selectors';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
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
      initialFilterParams: {},
      ...options,
    };

    if (types.indexOf(opts.type) === -1) {
      throw new Error('Please provide a valid type.');
    }

    if (typeof opts.acceptingOrder !== 'function') {
      // The function should accept an orderId and return a promise if it
      // is in the process of being accepted, otherwise false.
      throw new Error('Please provide a function to determine if a given order is in the process ' +
        'of being accepted.');
    }

    if (typeof opts.acceptOrder !== 'function') {
      // The function should accept an orderId and return a promise.
      throw new Error('Please provide a function to accept an order.');
    }

    if (typeof opts.rejectingOrder !== 'function') {
      // The function should accept an orderId and return a promise if it
      // is in the process of being rejected, otherwise false.
      throw new Error('Please provide a function to determine if a given order is in the process ' +
        'of being rejected.');
    }

    if (typeof opts.rejectOrder !== 'function') {
      // The function should accept an orderId and return a promise.
      throw new Error('Please provide a function to reject an order.');
    }

    if (typeof opts.cancelingOrder !== 'function') {
      // The function should accept an orderId and return a promise if it
      // is in the process of being canceled, otherwise false.
      throw new Error('Please provide a function to determine if a given order is in the process ' +
        'of being canceled.');
    }

    if (typeof opts.cancelOrder !== 'function') {
      // The function should accept an orderId and return a promise.
      throw new Error('Please provide a function to cancel an order.');
    }

    if (typeof opts.getProfiles !== 'function') {
      throw new Error('Please provide a function to retreive profiles.');
    }

    if (typeof opts.openOrder !== 'function') {
      throw new Error('Please provide a function to open the order detail modal.');
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

    // This will kick off our initial fetch.
    this.filterParams = opts.initialFilterParams;
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
    this.fetchTransactions();
  }

  onClickAcceptOrder(e) {
    this.options.acceptOrder(e.view.model.id)
      .always(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.setState({
              acceptOrderInProgress: false,
            });
          });
      })
      .done(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.model
              .set('state', 'AWAITING_FULFILLMENT');
          });
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('transactions.sales.failedAcceptHeading'),
          failReason
        );
      });

    e.view.setState({
      acceptOrderInProgress: true,
    });
  }

  onClickRejectOrder(e) {
    this.options.rejectOrder(e.view.model.id)
      .always(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.setState({
              rejectOrderInProgress: false,
            });
          });
      })
      .done(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.model
              .set('state', 'DECLINED');
          });
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('transactions.sales.failedRejectHeading'),
          failReason
        );
      });

    e.view.setState({
      rejectOrderInProgress: true,
    });
  }

  onClickCancelOrder(e) {
    this.options.cancelOrder(e.view.model.id)
      .always(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.setState({
              cancelOrderInProgress: false,
            });
          });
      })
      .done(() => {
        this.indexedViews.byOrder[e.view.model.id]
          .forEach(view => {
            view.model
              .set('state', 'CANCELED');
          });
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

  onClickRow(e) {
    let type = 'sale';

    if (this.type === 'purchases') {
      type = 'purchase';
    } else if (this.type === 'cases') {
      type = 'case';
    }

    const orderDetail = this.options.openOrder(e.view.model.id, type);
    this.listenTo(orderDetail.model, 'sync', () => (e.view.model.set('read', true)));
  }

  onClickNextPage() {
    this.fetchTransactions(this.curPage += 1);
  }

  onClickPrevPage() {
    this.fetchTransactions(this.curPage -= 1);
  }

  onAttach() {
    this.setFilterOnRoute();
  }

  getAvatars(models = []) {
    const profilesToFetch = [];

    models.forEach(md => {
      const vendorId = md.get('vendorId');
      const buyerId = md.get('buyerId');

      if (vendorId) {
        profilesToFetch.push(vendorId);
      }

      if (buyerId) {
        profilesToFetch.push(buyerId);
      }
    });

    if (profilesToFetch.length) {
      this.options.getProfiles(profilesToFetch)
        .forEach(profilePromise => {
          profilePromise.done(profile => {
            const flatProfile = profile.toJSON();
            const vendorViews = this.indexedViews.byVendor[flatProfile.peerID] || [];
            const buyerViews = this.indexedViews.byBuyer[flatProfile.peerID] || [];

            vendorViews.forEach(view => {
              view.setState({ vendorAvatarHashes: flatProfile.avatarHashes });
              view.model.set({ vendorHandle: flatProfile.handle });
            });

            buyerViews.forEach(view => {
              view.setState({ buyerAvatarHashes: flatProfile.avatarHashes });
              view.model.set({ buyerHandle: flatProfile.handle });
            });
          });
        });
    }
  }

  /*
   * Index the Row Views by Vendor and/or Buyer ID as well as orderID
   * so they could be easily retreived by the respective identifier.
   */
  indexRowViews() {
    this.indexedViews = {
      byVendor: {},
      byBuyer: {},
      byOrder: {},
    };

    this.views.forEach(view => {
      const vendorId = view.model.get('vendorId');
      const buyerId = view.model.get('buyerId');

      if (vendorId) {
        this.indexedViews.byVendor[vendorId] =
          this.indexedViews.byVendor[vendorId] || [];
        this.indexedViews.byVendor[vendorId].push(view);
      }

      if (buyerId) {
        this.indexedViews.byBuyer[buyerId] =
          this.indexedViews.byBuyer[buyerId] || [];
        this.indexedViews.byBuyer[buyerId].push(view);
      }

      this.indexedViews.byOrder[view.model.id] =
        this.indexedViews.byOrder[view.model.id] || [];
      this.indexedViews.byOrder[view.model.id].push(view);
    });
  }

  get transactionsPerPage() {
    return 20;
  }

  get filterParams() {
    return this._filterParams || {};
  }

  set filterParams(filterParams = {}) {
    if (!_.isEqual(filterParams, this._filterParams)) {
      this._filterParams = JSON.parse(JSON.stringify(filterParams)); // deep clone
      this.collection.reset();
      this.fetchTransactions(1, filterParams);
    }
  }

  setFilterOnRoute(filter = this.filterParams) {
    const queryFilter = {
      ...filter,
      // Joining with dashes instead of commas because commas
      // look really bizarre when encode in a query string.
      states: filter.states.join('-'),
    };

    if (queryFilter.search === '') {
      delete queryFilter.search;
    }

    let baseRoute = location.hash.split('?')[0];
    baseRoute = baseRoute.startsWith('#ob://') ?
      baseRoute.slice(6) : baseRoute.slice(1);

    app.router.navigate(`${baseRoute}?${$.param(queryFilter)}`, { replace: true });
  }

  fetchTransactions(page = this.curPage, filterParams = this.filterParams) {
    if (typeof page !== 'number') {
      throw new Error('Please provide a page number to fetch.');
    }

    if (page < 1) {
      throw new Error('Please provide a page number greater than zero.');
    }

    this.curPage = page;
    this.filterParams = filterParams;
    this.setFilterOnRoute();

    if (this.transactionsFetch) this.transactionsFetch.abort();

    const fetchParams = {
      limit: this.transactionsPerPage,
      ...filterParams,
      sortByAscending: ['UNREAD', 'DATE_ASC'].indexOf(filterParams.sortBy) !== -1,
      sortByRead: filterParams.sortBy === 'UNREAD',
      exclude: this.collection.map(md => md.id),
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

    this.transactionsFetch = this.collection.fetch({
      data: fetchParams,
      remove: false,
    });

    this.transactionsFetch.fail((jqXhr) => {
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
    }).done((data, textStatus, jqXhr) => {
      if (jqXhr.statusText === 'abort') return;

      this.queryTotal = data.queryCount;

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
    const transToRender = this.collection
      .slice(startIndex, startIndex + this.transactionsPerPage);
    // The collection contains all pages we've fetched, but we'll slice it and
    // only render the current page.
    transToRender
      .forEach(transaction => {
        const view = this.createChild(Row, {
          model: transaction,
          type: this.type,
          initialState: {
            acceptOrderInProgress: this.options.acceptingOrder(transaction.id),
            rejectOrderInProgress: this.options.rejectingOrder(transaction.id),
            cancelOrderInProgress: this.options.cancelingOrder(transaction.id),
          },
        });

        this.listenTo(view, 'clickAcceptOrder', this.onClickAcceptOrder);
        this.listenTo(view, 'clickRejectOrder', this.onClickRejectOrder);
        this.listenTo(view, 'clickCancelOrder', this.onClickCancelOrder);
        this.listenTo(view, 'clickRow', this.onClickRow);

        $(transactionsFrag).append(view.render().el);
        this.views.push(view);
      });

    this.indexRowViews();
    this.getAvatars(transToRender); // be sure to get avatars *after* indexRowViews()
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
