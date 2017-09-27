import app from '../../../../app';
import { openSimpleMessage } from '../../SimpleMessage';
import resyncBlockchain, {
  isResyncAvailable,
  isResyncingBlockchain,
  events as resyncEvents,
} from '../../../../utils/resyncBlockchain';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isSyncing: isResyncingBlockchain(),
        syncComplete: false,
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.listenTo(resyncEvents, 'resyncing',
      () => this.setState({
        isSyncing: true,
        syncComplete: false,
      }));
    this.listenTo(resyncEvents, 'resyncComplete',
      () => this.setState({ isSyncing: false }));
    this.listenTo(resyncEvents, 'resyncFail',
      () => this.setState({ isSyncing: false }));
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
    this.setState({ isSyncing: true });

    this.resync = resyncBlockchain()
      .always(() => {
        this.setState({ isSyncing: false });
      })
      .fail((xhr) => {
        if (xhr.statusText === 'abort') return;
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.resyncError'),
          failReason);
      })
      .done(() => {
        this.setState({ syncComplete: true });
      });
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/reloadTransactions.html', (t) => {
      this.$el.html(t({
        isResyncAvailable: isResyncAvailable(),
        ...this.getState(),
      }));
    });

    return this;
  }
}
