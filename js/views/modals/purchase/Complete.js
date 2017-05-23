import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return 'complete pad';
  }

  events() {
    return {
      'click .js-goToListing': 'close',
    };
  }

  render() {
    loadTemplate('modals/purchase/complete.html', t => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
      }));
    });

    return this;
  }
}
