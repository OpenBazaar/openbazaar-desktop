import { capitalize } from '../../../utils/string';
import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.options = opts || {};
  }

  className() {
    return 'contractTab';
  }

  events() {
    return {
      'click .js-backToSummary': 'onClickBackToSummary',
      'click .renderjson a': 'onClickRenderjsonLink',
    };
  }

  onClickBackToSummary() {
    this.trigger('clickBackToSummary');
  }

  onClickRenderjsonLink() {
    return false;
  }

  render() {
    const isCase = this.model.get('buyerOpened') !== undefined;
    const templateData = {
      capitalize,
      buyerOpened: this.model.get('buyerOpened'),
      isCase,
      // temorarily hard-coded pending server set-up issues.
      vendorContractVerified: true,
      buyerContractVerified: true,
    };
    let contract;
    let buyerContract;
    let vendorContract;


    if (!isCase) {
      contract = this.model.get('rawContract');
    } else {
      if (this.model.get('buyerOpened')) {
        // Only the contract of whoever opened the case is guaranteed to be available.
        // The other will be available when the party comes online.
        buyerContract = this.model.get('rawBuyerContract');
        vendorContract = this.model.get('rawVendorContract');
        templateData.otherContractAvailable = !!this.model.get('vendorContract');
      } else {
        vendorContract = this.model.get('rawVendorContract');
        buyerContract = this.model.get('rawBuyerContract');
        templateData.otherContractAvailable = !!this.model.get('buyerContract');
      }
    }

    loadTemplate('modals/orderDetail/contract.html', t => {
      this.$el.html(t(templateData));

      if (contract) {
        this.$('.js-jsonContractContainer')
          .append(window.renderjson.set_show_to_level(1)(contract));
      } else {
        if (buyerContract) {
          this.$('.js-jsonBuyerContractContainer')
            .append(window.renderjson.set_show_to_level(1)(buyerContract));
        }

        if (vendorContract) {
          this.$('.js-jsonVendorContractContainer')
            .append(window.renderjson.set_show_to_level(1)(vendorContract));
        }
      }
    });

    return this;
  }
}
