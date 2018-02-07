import app from '../../app';
import { launchSettingsModal } from '../../utils/modalManager';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        feeLevel: app.localSettings.get('defaultTransactionFee'),
        feeLevelClass: 'txB',
        changeLinkClass: 'btnAsLink clrT2',
      },
      ...options,
    };

    super(opts);

    this.listenTo(app.localSettings, 'change:defaultTransactionFee',
      (md, val) => this.setState({ feeLevel: val }));
  }

  className() {
    return 'feeChange';
  }

  events() {
    return {
      'click .js-changeFee': 'onClickChangeFee',
    };
  }

  onClickChangeFee() {
    launchSettingsModal({
      initialTab: 'Advanced',
      scrollTo: '.js-feeSection',
    });
  }

  render() {
    loadTemplate('components/feeChange.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
