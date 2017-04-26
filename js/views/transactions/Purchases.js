import app from '../../app';
// import moment from 'moment';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import PurchasesTable from './PurchasesTable';

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
    this.filter = { ...options.defaultFilter };
    this.fetchPurchases();
  }

  className() {
    return 'purchases tx5';
  }

  get purchasesPerPage() {
    return 15;
  }

  fetchPurchases() {
    if (this.purchasesFetch) this.purchasesFetch.abort();

    const fetchParams = {
      limit: this.purchasesPerPage,
    };

    if (this.collection.length) {
      fetchParams.offsetId = this.collection.at(this.collection.length - 1).id;
    }

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

      if (this.purchasesTable) {
        this.purchasesTable.setState({
          isFetching: false,
          fetchFailed: true,
          fetchError,
        });
      }
    }).done(() => {
      if (this.isRemoved()) return;

      if (this.purchasesTable) {
        this.purchasesTable.setState({
          isFetching: false,
        });
      }
    });

    if (this.purchasesTable) {
      this.purchasesTable.setState({
        isFetching: true,
        fetchFailed: false,
        fetchError: '',
      });
    }
  }

  remove() {
    if (this.purchasesFetch) this.purchasesFetch.abort();
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
      this.purchasesTable = this.createChild(PurchasesTable, {
        collection: this.collection,
        initialState: {
          isFetching: true,
        },
      });
      this.$('.js-purchasesTableContainer').html(this.purchasesTable.render().el);
      this.listenTo(this.purchasesTable, 'retryFetchClick', () => this.fetchPurchases());
    });

    return this;
  }
}
