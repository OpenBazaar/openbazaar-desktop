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
      throw new Error('Please provide a transactions collection.');
    }

    const types = ['sales', 'purchases', 'cases'];

    if (types.indexOf(opts.type) === -1) {
      throw new Error(`Type needs to be one of ${types}.`);
    }

    if (!opts.filterConfig) {
      throw new Error('Please provide a filter config object.');
    }

    this.options = opts || {};
    this.type = opts.type;
    this.filterConfig = opts.filterConfig;
    this.acceptPosts = {};
    this.rejectPosts = {};
    this.cancelPosts = {};
    this.filter = { ...opts.defaultFilter };

    this.listenTo(this.collection, 'request', (cl, xhr) => {
      setTimeout(() => {
        if (this.table && this.table.curPage === 1) {
          this.$queryTotalLine.empty();

          xhr.done(data => {
            const count =
              `<span class="txB">
                ${app.polyglot.t(`transactions.${this.type}.countTransactions`,
                  { smart_count: data.queryCount })}
               </span>`;
            this.$queryTotalLine.html(
              app.polyglot.t(`transactions.${this.type}.countTransactionsFound`,
                { countTransactions: count })
            );
          });
        }
      });
    });
  }

  className() {
    return `${this.type} tx5`;
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
    this.table.filterParams = this.filter;
  }

  onKeyUpSearch(e) {
    // wait until they stop typing
    clearTimeout(this.searchKeyUpTimer);

    this.searchKeyUpTimer = setTimeout(() => {
      this.filter.search = e.target.value;
      this.table.filterParams = this.filter;
    }, 150);
  }


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

  confirmOrder(orderId, reject = false) {
    if (!orderId) {
      throw new Error('Please provide an orderId');
    }

    let post = this[`${reject ? 'reject' : 'accept'}Posts`][orderId];

    if (!post) {
      post = $.post({
        url: app.getServerUrl('ob/orderconfirmation'),
        data: JSON.stringify({
          orderId,
          reject,
        }),
        dataType: 'json',
        contentType: 'application/json',
      }).always(() => {
        delete this[`${reject ? 'reject' : 'accept'}Posts`][orderId];
      });

      this[`${reject ? 'reject' : 'accept'}Posts`][orderId] = post;
    }

    return post;
  }

  acceptingOrder(orderId) {
    return this.acceptPosts[orderId] || false;
  }

  acceptOrder(orderId) {
    return this.confirmOrder(orderId);
  }

  rejectingOrder(orderId) {
    return this.rejectPosts[orderId] || false;
  }

  rejectOrder(orderId) {
    return this.confirmOrder(orderId, true);
  }

  get $queryTotalLine() {
    return this._$queryTotalLine ||
      (this._$queryTotalLine = this.$('.js-queryTotalLine'));
  }

  get $filterCheckboxes() {
    return this._$filterCheckboxes ||
      (this._$filterCheckboxes = this.$('.filter input'));
  }

  remove() {
    Object.keys(this.acceptPosts, post => post.abort());
    Object.keys(this.rejectPosts, post => post.abort());
    Object.keys(this.cancelPosts, post => post.abort());
    clearTimeout(this.searchKeyUpTimer);
    super.remove();
  }

  render() {
    loadTemplate('transactions/filters.html', (filterT) => {
      const filtersHtml = filterT({
        filters: this.filterConfig,
      });

      loadTemplate('transactions/tab.html', (t) => {
        this.$el.html(t({
          type: this.type,
          filtersHtml,
          searchTerm: this.filter.search,
        }));

        this._$filterCheckboxes = null;

        if (this.table) this.table.remove();
        this.table = this.createChild(TransactionsTable, {
          type: this.type,
          collection: this.collection,
          cancelOrder: this.cancelOrder.bind(this),
          cancelingOrder: this.cancelingOrder.bind(this),
          acceptingOrder: this.acceptingOrder.bind(this),
          acceptOrder: this.acceptOrder.bind(this),
          rejectingOrder: this.rejectingOrder.bind(this),
          rejectOrder: this.rejectOrder.bind(this),
          initialFilterParams: this.filter,
        });
        this.$('.js-tableContainer').html(this.table.render().el);
      });
    });

    return this;
  }
}
