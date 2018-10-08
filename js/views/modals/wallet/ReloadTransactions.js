import resyncBlockchain, {
  isResyncAvailable,
  isResyncingBlockchain,
  events as resyncEvents,
} from '../../../utils/resyncBlockchain';
import { recordEvent } from '../../../utils/metrics';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.initialState ||
      (typeof options.initialState.coinType !== 'string' &&
      !options.initialState.coinType)) {
      throw new Error('Please provide a coinType in the initial state');
    }

    const opts = {
      ...options,
      initialState: {
        isSyncing: isResyncingBlockchain(options.initialState.coinType),
        syncComplete: false,
        isResyncAvailable: isResyncAvailable(options.initialState.coinType),
        ...options.initialState || {},
      },
    };

    super(opts);
    this.listenTo(resyncEvents, 'resyncing',
      () => this.setState({
        isSyncing: true,
        syncComplete: false,
      }));
    this.listenTo(resyncEvents, 'resyncComplete',
      () => this.setState({
        isSyncing: false,
        syncComplete: true,
      }));
    this.listenTo(resyncEvents, 'resyncFail',
      () => this.setState({ isSyncing: false }));
    this.listenTo(resyncEvents, 'changeResyncAvailable', e => {
      if (e.coinType === this.getState().coinType) {
        this.setState({ isResyncAvailable: !!e.available });
      }
    });
  }

  className() {
    return 'flexVCent gutterH';
  }

  events() {
    return {
      'click .js-resync': 'onClickResync',
    };
  }

  onClickResync() {
    recordEvent('Settings_Advanced_Resync');
    resyncBlockchain(this.getState().coinType);
  }

  render() {
    super.render();

    loadTemplate('modals/wallet/reloadTransactions.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
