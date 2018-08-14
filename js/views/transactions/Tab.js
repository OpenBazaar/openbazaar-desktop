import _ from 'underscore';
import $ from 'jquery';
import app from '../../app';
import '../../lib/select2';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import TransactionsTable from './table/Table';
import { capitalize } from '../../utils/string';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      defaultFilter: {
        search: '',
        sortBy: 'UNREAD',
        states: [],
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

    if (typeof opts.openOrder !== 'function') {
      throw new Error('Please provide a function to open the order detail modal.');
    }

    this.options = opts || {};
    this.type = opts.type;
    this.filterConfig = opts.filterConfig;
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
                  { smart_count: count })
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
      this.filter = {
        ...this.filter,
        search: e.target.value,
      };
    }, 200);
  }

  onChangeSortBy(e) {
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
    return _.isEqual(this.options.defaultFilter, _.omit(this.filter, 'orderId'));
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
          capitalize,
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
          initialFilterParams: this.filter,
          getProfiles: this.options.getProfiles,
          openOrder: this.options.openOrder,
          openedOrderModal: this.options.openedOrderModal,
        });
        this.$('.js-tableContainer').html(this.table.render().el);
      });
    });

    return this;
  }
}
