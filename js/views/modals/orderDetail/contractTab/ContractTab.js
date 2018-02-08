import BaseVw from '../../../baseVw';
import loadTemplate from '../../../../utils/loadTemplate';
import Contract from './Contract';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    console.log('boo');
    window.boo = this.model;

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

  get isCase() {
    return this.model.get('buyerOpened') !== undefined;
  }

  // render() {
  //   const isCase = this.model.get('buyerOpened') !== undefined;
  //   const vendorContractErrors = this.model.get('vendorContractValidationErrors');
  //   const buyerContractErrors = this.model.get('buyerContractValidationErrors');
  //   const templateData = {
  //     capitalize,
  //     buyerOpened: this.model.get('buyerOpened'),
  //     isCase,
  //     vendorContractVerified: !vendorContractErrors ||
  //       (Array.isArray(vendorContractErrors) && !vendorContractErrors.length),
  //     buyerContractVerified: !buyerContractErrors ||
  //       (Array.isArray(buyerContractErrors) && !buyerContractErrors.length),
  //   };
  //   let contract;
  //   let buyerContract;
  //   let vendorContract;


  //   if (!isCase) {
  //     contract = this.model.get('rawContract');
  //   } else {
  //     if (this.model.get('buyerOpened')) {
  //       // Only the contract of whoever opened the case is guaranteed to be available.
  //       // The other will be available when the party comes online.
  //       buyerContract = this.model.get('rawBuyerContract');
  //       vendorContract = this.model.get('rawVendorContract');
  //       templateData.otherContractAvailable = !!this.model.get('vendorContract');
  //     } else {
  //       vendorContract = this.model.get('rawVendorContract');
  //       buyerContract = this.model.get('rawBuyerContract');
  //       templateData.otherContractAvailable = !!this.model.get('buyerContract');
  //     }
  //   }

  //   loadTemplate('modals/orderDetail/contract.html', t => {
  //     this.$el.html(t(templateData));

  //     if (contract) {
  //       this.$('.js-jsonContractContainer')
  //         .append(renderjson.set_show_to_level(1)(contract));
  //     } else {
  //       if (buyerContract) {
  //         this.$('.js-jsonBuyerContractContainer')
  //           .append(renderjson.set_show_to_level(1)(buyerContract));
  //       }

  //       if (vendorContract) {
  //         this.$('.js-jsonVendorContractContainer')
  //           .append(renderjson.set_show_to_level(1)(vendorContract));
  //       }
  //     }
  //   });

  //   return this;
  // }

  renderStatus() {
    let msg = '';
    const buyerContractArrived = !!this.model.get('buyerContract');
    const vendorContractArrived = !!this.model.get('vendorContract');

    if (this.isCase) {
      if (buyerContractArrived && this.model.isBuyerContractValid &&
        vendorContractArrived && this.model.isVendorContractValid) {
        msg = '<p class="clrTEm flexVCent"><span class="ion-ios-checkmark-outline tx1 margRSm">' +
          '</span>Both the buyer\'s and vendor\'s contracts have been verified as authentic.</p>';
      } else if (!vendorContractArrived) {
        msg = '<p class="clrTErr flexVCent"><span class="ion-android-warning tx1 margRSm">' +
          '</span>The vendor\'s contract has not yet arrived. It will be sent over the next ' +
          'time they come online.</p>';
      } else if (!buyerContractArrived) {
        msg = '<p class="clrTErr flexVCent"><span class="ion-android-warning tx1 margRSm">' +
          '</span>The buyer\'s contract has not yet arrived. It will be sent over the next ' +
          'time they come online.</p>';
      }
    }

    this.getCachedEl('.js-statusContainer')
      .html(msg);
  }

  render() {
    loadTemplate('modals/orderDetail/contractTab/contractTab.html', t => {
      this.$el.html(t());
      this.renderStatus();

      if (!this.isCase) {
        this.contractVw = this.createChild(Contract, {
          contract: this.model.get('rawContract'),
        });
        this.$el.append(this.contractVw.render().el);
      }
    });

    return this;
  }
}
