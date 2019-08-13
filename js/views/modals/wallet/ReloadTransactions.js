import app from '../../../app';
import { openSimpleMessage } from '../../../views/modals/SimpleMessage';
import resyncBlockchain, {
  isResyncAvailable,
  isResyncingBlockchain,
  events as resyncEvents,
} from '../../../utils/resyncBlockchain';
import { ensureMainnetCode } from '../../../data/walletCurrencies';
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
        isResyncAvailable: isResyncAvailable(options.initialState.coinType),
        ...options.initialState || {},
      },
    };

    super(opts);
    this.listenTo(resyncEvents, 'resyncing', e => {
      if (e.coinType === this.getState().coinType) {
        this.setState({
          isSyncing: true,
        });
      }
    });

    this.listenTo(resyncEvents, 'resyncComplete', e => {
      if (e.coinType === this.getState().coinType) {
        this.setState({
          isSyncing: false,
        });
      }
    });

    this.listenTo(resyncEvents, 'resyncFail', e => {
      if (e.coinType === this.getState().coinType) {
        this.setState({ isSyncing: false });
      }
    });

    this.listenTo(resyncEvents, 'changeResyncAvailable', e => {
      if (e.coinType === this.getState().coinType) {
        this.setState({ isResyncAvailable: e.available });
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
    const coinType = this.getState().coinType;
    recordEvent('Wallet_Resync');
    resyncBlockchain(coinType)
      .done(() => {
        openSimpleMessage(
          app.polyglot.t('wallet.reloadTransactionsWidget.resyncCompleteTitle', {
            cur: ensureMainnetCode(coinType),
          }),
          app.polyglot.t('wallet.reloadTransactionsWidget.resyncComplete')
        );
      });
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();
    let newState = { ...state };
    if (state.coinType !== undefined && state.coinType !== curState.coinType) {
      newState = {
        ...newState,
        isSyncing: isResyncingBlockchain(state.coinType),
        isResyncAvailable: isResyncAvailable(state.coinType),
      };
    }

    return super.setState(newState, options);
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
