import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return 'complete';
  }

  events() {
    return {
      'click .js-goToListing': 'close',
    };
  }

  render() {
    const processingTime = this.options.processingTime ||
      app.polyglot.t('purchase.completeSection.noData');
    loadTemplate('modals/purchase/complete.html', t => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
        processingTime,
      }));
    });

    return this;
  }
}
