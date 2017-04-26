import app from '../../app';
import moment from 'moment';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'purchases tx5';
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
          moment,
        }));
      });
    });

    return this;
  }
}
