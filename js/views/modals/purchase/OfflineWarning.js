import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);

    if (!options.listingCurrency) {
      throw new Error('Please provide the listing currency code');
    }

    this.options = options;
  }

  className() {
    return 'receipt flexColRows gutterVSm tx5b';
  }

  render() {
    loadTemplate('modals/purchase/offlineWarning.html', t => {
      this.$el.html(t({
        ...this.getState(),
        listingCurrency: this.options.listingCurrency,
        displayCurrency: app.settings.get('localCurrency'),
      }));
    });

    return this;
  }
}
