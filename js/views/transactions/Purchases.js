import $ from 'jquery';
import app from '../../app';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import TransactionsTable from './table/Table';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      defaultFilter: {
        search: '',
        sort: 'date-desc',
        state: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      ...options,
    };

    super(opts);

    if (!this.collection) {
      throw new Error('Please provide a purchases collection.');
    }

    this.options = opts || {};
    // todo: move to sale
    // this.acceptPosts = {};
    this.cancelPosts = {};
    this.filter = { ...opts.defaultFilter };
  }

  className() {
    return 'purchases tx5';
  }

  events() {
    return {
      'change .filter input': 'onChangeFilter',
      'keyup .js-searchInput': 'onKeyUpSearch',
    };
  }

  onChangeFilter() {
    let state = [];
    this.filter.state = this.$filterCheckboxes.filter(':checked')
      .each((index, checkbox) => {
        state = state.concat($(checkbox).data('state'));
      });
    this.filter.state = state;
    this.purchasesTable.filterParams = this.filter;
  }

  onKeyUpSearch(e) {
    // wait until they stop typing
    clearTimeout(this.searchKeyUpTimer);

    this.searchKeyUpTimer = setTimeout(() => {
      this.filter.search = e.target.value;
      this.purchasesTable.filterParams = this.filter;
    }, 150);
  }

  // Will move to Sales.js later
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

  get $queryTotalLine() {
    return this._$queryTotalLine ||
      (this._$queryTotalLine = this.$('.js-queryTotalLine'));
  }

  get filterTemplateData() {
    return [
      {
        id: 'filterPurchasing',
        text: app.polyglot.t('transactions.filters.purchasing'),
        checked: this.filter.state.indexOf(0) > -1 ||
          this.filter.state.indexOf(1) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[0, 1]',
        },
      },
      {
        id: 'filterReady',
        text: app.polyglot.t('transactions.filters.ready'),
        checked: this.filter.state.indexOf(2) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[2]',
        },
      },
      {
        id: 'filterFulfilled',
        text: app.polyglot.t('transactions.filters.fulfilled'),
        checked: this.filter.state.indexOf(3) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[3]',
        },
      },
      {
        id: 'filterRefunded',
        text: app.polyglot.t('transactions.filters.refunded'),
        checked: this.filter.state.indexOf(8) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[8]',
        },
      },
      {
        id: 'filterDisputeOpen',
        text: app.polyglot.t('transactions.filters.disputeOpen'),
        checked: this.filter.state.indexOf(5) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[5]',
        },
      },
      {
        id: 'filterDisputePending',
        text: app.polyglot.t('transactions.filters.disputePending'),
        checked: this.filter.state.indexOf(6) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[6]',
        },
      },
      {
        id: 'filterDisputeClosed',
        text: app.polyglot.t('transactions.filters.disputeClosed'),
        checked: this.filter.state.indexOf(7) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[7]',
        },
      },
      {
        id: 'filterCompleted',
        text: app.polyglot.t('transactions.filters.completed'),
        checked: this.filter.state.indexOf(4) > -1 ||
          this.filter.state.indexOf(9) > -1 ||
          this.filter.state.indexOf(10) > -1,
        className: 'filter',
        attrs: {
          'data-state': '[4, 9, 10]',
        },
      },
    ];
  }

  get $filterCheckboxes() {
    return this._$filterCheckboxes ||
      (this._$filterCheckboxes = this.$('.filter input'));
  }

  remove() {
    // todo: move to sales
    // Object.keys(this.acceptPosts, post => post.abort());
    Object.keys(this.cancelPosts, post => post.abort());
    clearTimeout(this.searchKeyUpTimer);
    super.remove();
  }

  render() {
    loadTemplate('transactions/filters.html', (filterT) => {
      const filtersHtml = filterT({
        filters: this.filterTemplateData,
      });

      loadTemplate('transactions/purchases.html', (t) => {
        this.$el.html(t({
          filtersHtml,
          searchTerm: this.filter.search,
        }));

        this._$filterCheckboxes = null;

        if (this.purchasesTable) this.purchasesTable.remove();
        this.purchasesTable = this.createChild(TransactionsTable, {
          type: 'purchases',
          collection: this.collection,
          initialState: {
            isFetching: true,
          },
          cancelOrder: this.cancelOrder.bind(this),
          cancelingOrder: this.cancelingOrder.bind(this),
          initialFilterParams: this.filter,
        });
        this.$('.js-purchasesTableContainer').html(this.purchasesTable.render().el);
        this.listenTo(this.purchasesTable, 'retryFetchClick', () => this.fetchPurchases());
      });
    });

    return this;
  }
}
