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
        isResyncAvailable: isResyncAvailable(),
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
      () => this.setState({
        isSyncing: false,
        syncComplete: true,
      }));
    this.listenTo(resyncEvents, 'resyncFail',
      () => this.setState({ isSyncing: false }));
    this.listenTo(resyncEvents, 'changeResyncAvailable',
      (resyncAvailable) => this.setState({ isResyncAvailable: resyncAvailable }));
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
    resyncBlockchain();
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/reloadTransactions.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
