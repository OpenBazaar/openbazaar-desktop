import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import {
  getInventory,
  isFetching,
  events as inventoryEvents,
} from '../../utils/inventory';

export default class extends baseVw {
  constructor(options = {}) {
    if (typeof options.peerId !== 'string' || !options.peerId) {
      throw new Error('Please provide a peerId.');
    }

    if (typeof options.slug !== 'string' || !options.slug) {
      throw new Error('Please provide a slug.');
    }

    const opts = {
      ...options,
      initialState: {
        isFetching: isFetching(options.peerId, options.slug),
        fetchFailed: false,
        fetchError: '',
        coinType: '',
        contentClass: 'txB',
        spinnerClass: 'spinnerSm',
        spacerText: '98.5432 ZEC',
        displayCur: 'PLN', // TODO TODO TODO TODO change to USD
        // amount: undefined, // will be set on a 'inventory-change' or
                              // can be provided as a number
        ...options.initialState,
      },
    };

    super(opts);
    this.options = options;

    this.listenTo(inventoryEvents, 'inventory-fetching', e => {
      if (e.peerId !== options.peerId || e.slug !== options.slug) return;
      this.setState({
        isFetching: true,
        fetchFailed: false,
        fetchError: '',
      });
    });

    this.listenTo(inventoryEvents, 'inventory-fetch-fail', e => {
      if (e.peerId !== options.peerId || e.slug !== options.slug) return;
      this.setState({
        isFetching: false,
        fetchFailed: true,
        fetchError: e.xhr && e.xhr.responseJSON && e.xhr.responseJSON.reason || '',
      });
    });

    this.listenTo(inventoryEvents, 'inventory-fetch-success', e => {
      if (e.peerId !== options.peerId || e.slug !== options.slug) return;
      this.setState({ isFetching: false });
    });

    this.listenTo(inventoryEvents, 'inventory-change', e => {
      if (e.peerId !== options.peerId || e.slug !== options.slug) return;
      this.setState({ amount: e.inventory });
    });
  }

  className() {
    return 'quantityDisplay';
  }

  tagName() {
    return 'span';
  }

  events() {
    return {
      'click .js-retry': 'onClickRetry',
    };
  }

  onClickRetry() {
    this.inventoryFetch = getInventory(this.options.peerId, this.options.slug);
  }

  remove() {
    if (this.inventoryFetch) this.inventoryFetch.abort();
    return super.remove();
  }

  render() {
    loadTemplate('components/quantityDisplay.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
