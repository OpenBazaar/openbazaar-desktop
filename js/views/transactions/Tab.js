import _ from 'underscore';
import $ from 'jquery';
import app from '../../app';
import '../../lib/select2';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import TransactionsTable from './table/Table';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      defaultFilter: {
        search: '',
        sortBy: 'UNREAD',
        states: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      ...options,
    };

    opts.initialFilter = opts.initialFilter || { ...opts.defaultFilter };

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

    if (typeof opts.getProfiles !== 'function') {
      throw new Error('Please provide a function to retreive profiles.');
    }

    this.options = opts || {};
    this.type = opts.type;
    this.filterConfig = opts.filterConfig;
    this.acceptPosts = {};
    this.rejectPosts = {};
    this.cancelPosts = {};
    this._filter = { ...opts.initialFilter };

    this.listenTo(this.collection, 'request', (cl, xhr) => {
      if (this.table) {
        this.$queryTotalWrapper.addClass('hide');
      }

      setTimeout(() => {
        if (this.table) {
          xhr.done(data => {
            const count =
              `<span class="txB">
                ${app.polyglot.t(`transactions.${this.type}.countTransactions`,
                  { smart_count: data.queryCount })}
               </span>`;
            this.$queryTotalWrapper.find('.js-queryTotalLine')
              .html(
                app.polyglot.t(`transactions.${this.type}.countTransactionsFound`,
                  { countTransactions: count })
              );
            this.$queryTotalWrapper.removeClass('hide');
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
      'change .js-sortBySelect': 'onChangeSortBy',
      'click .js-resetQuery': 'onClickResetQuery',
    };
  }

  onChangeFilter() {
    let states = [];
    this.$filterCheckboxes.filter(':checked')
      .each((index, checkbox) => {
        states = states.concat($(checkbox).data('state'));
      });
    // this.filter.states = states;
    // this.table.filterParams = this.filter;

    this.filter = {
      ...this.filter,
      states,
    };
  }

  get filter() {
    return this._filter;
  }

  set filter(filter = {}) {
    if (!_.isEqual(filter, this._filter)) {
      this._filter = { ...filter };

      if (this.table) {
        this.table.filterParams = filter;
      }

      this.$resetQuery.toggleClass('hide', this.currentFilterIsDefault());
    }
  }

  onKeyUpSearch(e) {
    // wait until they stop typing
    clearTimeout(this.searchKeyUpTimer);

    this.searchKeyUpTimer = setTimeout(() => {
      // this.filter.search = e.target.value;
      // this.table.filterParams = this.filter;
      this.filter = {
        ...this.filter,
        search: e.target.value,
      };
    }, 200);
  }

  onChangeSortBy(e) {
    // this.table.filterParams = {
    //   ...this.filter,
    //   sortBy: e.target.value,
    // };
    this.filter = {
      ...this.filter,
      sortBy: e.target.value,
    };
  }

  onAttach() {
    if (typeof this.table.onAttach === 'function') {
      this.table.onAttach.call(this.table);
    }
  }

  onClickResetQuery() {
    this.filter = { ...this.options.defaultFilter };
    this.render();
    // this.table.filterParams = this.filter;
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

  /*
   * Based on the provided list of checkedStates, this function
   * will return a filterConfig list with the checked value set for each
   * filter.
   */
  setCheckedFilters(filterConfig = [], checkedStates = []) {
    const checkedConfig = [];

    filterConfig.forEach((filter, index) => {
      if (!filter.targetState || !filter.targetState.length) {
        throw new Error(`Filter at index ${index} needs a tragetState ` +
          'provided as an array.');
      }

      filter.targetState.forEach(targetState => {
        checkedConfig[index] = {
          ...filterConfig[index],
          checked: checkedStates.indexOf(targetState) > -1,
        };
      });
    });

    return checkedConfig;
  }

  currentFilterIsDefault() {
    return _.isEqual(this.options.defaultFilter, this.filter);
  }

  get $queryTotalWrapper() {
    return this._$queryTotalWrapper ||
      (this._$queryTotalWrapper = this.$('.js-queryTotalWrapper'));
  }

  get $filterCheckboxes() {
    return this._$filterCheckboxes ||
      (this._$filterCheckboxes = this.$('.filter input'));
  }

  get $resetQuery() {
    return this._$resetQuery ||
      (this._$resetQuery = this.$('.js-resetQuery'));
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
        filters: this.setCheckedFilters(this.filterConfig, this.filter.states),
      });

      loadTemplate('transactions/tab.html', (t) => {
        this.$el.html(t({
          type: this.type,
          filtersHtml,
          filter: this.filter,
          currentFilterIsDefault: this.currentFilterIsDefault(),
        }));

        this._$filterCheckboxes = null;
        this._$queryTotalWrapper = null;
        this._$resetQuery = null;

        this.$('.js-sortBySelect').select2({
          minimumResultsForSearch: -1,
          dropdownParent: this.$('.js-sortBySelectDropdownContainer'),
        });

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
          getProfiles: this.options.getProfiles,
        });
        this.$('.js-tableContainer').html(this.table.render().el);
      });
    });

    return this;
  }
}
