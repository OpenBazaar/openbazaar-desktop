import $ from 'jquery';
import app from '../../app';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import TransactionsTable from './table/Table';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.collection) {
      throw new Error('Please provide a purchases collection.');
    }

    if (!options.defaultFilter) {
      throw new Error('Please provide a default filter.');
    }

    this.options = options || {};
    // todo: move to sale
    // this.acceptPosts = {};
    this.cancelPosts = {};
    this.filter = { ...options.defaultFilter };
  }

  className() {
    return 'purchases tx5';
  }

  // Will move to Sale.js later
  // acceptingOrder(orderId) {
  //   return this.acceptPosts[orderId] || false;
  // }

  // Will move to Sale.js later
  // acceptOrder(orderId) {
  //   if (!orderId) {
  //     throw new Error('Please provide an orderId');
  //   }

  //   if (this.acceptPosts[orderId]) {
  //     return this.acceptPosts[orderId];
  //   }

  //   const acceptPost = $.post({
  //     // todo: update URL!
  //     url: app.getServerUrl('ob/fetchprofiles?async=true'),
  //     data: JSON.stringify({
  //       orderId,
  //       reject: false,
  //     }),
  //     dataType: 'json',
  //     contentType: 'application/json',
  //   }).always(() => {
  //     delete this.acceptPosts[orderId];
  //   });

  //   this.acceptPosts[orderId] = acceptPost;

  //   return acceptPost;
  // }

  cancelingOrder(orderId) {
    return this.cancelPosts[orderId] || false;
  }

  cancelOrder(orderId) {
    if (!orderId) {
      throw new Error('Please provide an orderId');
    }

    if (this.cancelPosts[orderId]) {
      return this.cancelPosts[orderId];
    }

    const cancelPost = $.post({
      url: app.getServerUrl('ob/ordercancel'),
      data: JSON.stringify({
        orderId,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      delete this.cancelPosts[orderId];
    });

    this.cancelPosts[orderId] = cancelPost;

    return cancelPost;
  }

  remove() {
    // todo: move to sales
    // Object.keys(this.acceptPosts, post => post.abort());
    Object.keys(this.cancelPosts, post => post.abort());
    super.remove();
  }

  render() {
    loadTemplate('transactions/filters.html', (filterT) => {
      const filtersHtml = filterT({
        filters: [
          {
            id: 'filterFulfilled',
            text: app.polyglot.t('transactions.filters.purchasing'),
          },
          {
            id: 'filterReady',
            text: app.polyglot.t('transactions.filters.ready'),
          },
          {
            id: 'filterFulfilled',
            text: app.polyglot.t('transactions.filters.fulfilled'),
          },
          {
            id: 'filterRefunded',
            text: app.polyglot.t('transactions.filters.refunded'),
          },
          {
            id: 'filterDisputeOpen',
            text: app.polyglot.t('transactions.filters.disputeOpen'),
          },
          {
            id: 'filterDisputePending',
            text: app.polyglot.t('transactions.filters.disputePending'),
          },
          {
            id: 'filterDisputeClosed',
            text: app.polyglot.t('transactions.filters.disputeClosed'),
          },
          {
            id: 'filterCompleted',
            text: app.polyglot.t('transactions.filters.completed'),
          },
        ],
      });

      loadTemplate('transactions/purchases.html', (t) => {
        this.$el.html(t({
          filtersHtml,
        }));
      });

      if (this.purchasesTable) this.purchasesTable.remove();
      this.purchasesTable = this.createChild(TransactionsTable, {
        type: 'purchases',
        collection: this.collection,
        initialState: {
          isFetching: true,
        },
        cancelOrder: this.cancelOrder.bind(this),
        cancelingOrder: this.cancelingOrder.bind(this),
      });
      this.$('.js-purchasesTableContainer').html(this.purchasesTable.render().el);
      this.listenTo(this.purchasesTable, 'retryFetchClick', () => this.fetchPurchases());
    });

    return this;
  }
}
