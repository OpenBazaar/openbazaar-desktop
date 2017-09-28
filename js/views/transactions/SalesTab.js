import app from '../../app';
import Tab from './Tab';
import resyncBlockchain, {
  isResyncAvailable,
  isResyncingBlockchain,
  events as resyncEvents,
} from '../../utils/resyncBlockchain';
import ResyncPopInMessage from './ResyncPopInMessage';

export default class extends Tab {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!options.unfilteredSalesFetch ||
      !(typeof options.unfilteredSalesFetch.then === 'function')) {
      throw new Error('Please provide a promise containing the fetch of the unfiltered ' +
        'sales list.');
    }

    options.unfilteredSalesFetch.done(() => this.checkShowResyncPopin());

    this.listenTo(resyncEvents, 'changeResyncAvailable', () => {
      if (!this.resyncPopinMessage) {
        this.checkShowResyncPopin();
      }
    });

    this.listenTo(resyncEvents, 'resyncing', () => {
      if (this.resyncPopinMessage) {
        this.resyncPopinMessage.setState({
          isSyncing: true,
        });
      }
    });

    this.listenTo(resyncEvents, 'resyncComplete', () => {
      if (this.resyncPopinMessage) {
        this.resyncPopinMessage.setState({
          isSyncing: false,
          complete: true,
        });
      }
    });

    this.listenTo(resyncEvents, 'resyncFail', () => {
      if (this.resyncPopinMessage) {
        this.resyncPopinMessage.setState({
          isSyncing: false,
        });
      }
    });
  }

  get transactionAgeForResync() {
    // return 1000 * 60 * 60 * 24;
    return 1000 * 60 * 60 * 2;
  }

  checkShowResyncPopin() {
    if (this.options.unfilteredSalesFetch.state() !== 'resolved') return;

    this.options.unfilteredSalesFetch.done(data => {
      if (data && data.sales && data.sales.length) {
        const sale = data.sales[0];
        if (Date.now() - (new Date(sale.timestamp)).getTime() >
          this.transactionAgeForResync && isResyncAvailable()) {
          this.showResyncPopinMessage();
        }
      }
    });
  }

  showResyncPopinMessage() {
    if (this.resyncPopinMessage) return;

    const linkText = app.polyglot.t('transactions.sales.resyncPopInMessage.link');
    const needSyncText = app.polyglot.t('transactions.sales.resyncPopInMessage.message', {
      icon: '<span class="ion-alert-circled"></span>',
      link: `<a class="clrTEm js-resync">${linkText}</a>`,
      text: `<b>${app.polyglot.t('transactions.sales.resyncPopInMessage.text')}</a>`,
    });

    this.resyncPopinMessage = this.createChild(ResyncPopInMessage, {
      messageText: '-----', // not used but needed so the pop in message base class dosn't cry
      initialState: {
        dismissable: true,
        needSyncText,
        isSyncing: isResyncingBlockchain(),
      },
    });

    this.listenTo(this.resyncPopinMessage, 'clickResync', () => resyncBlockchain());

    this.listenTo(this.resyncPopinMessage, 'clickDismiss', () => {
      this.resyncPopinMessage.remove();
      this.resyncPopinMessage = null;
    });

    this.getCachedEl('.js-popInMessageHolder').append(this.resyncPopinMessage.render().el);
  }
}
