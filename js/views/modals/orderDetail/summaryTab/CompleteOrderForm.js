import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.model) {
      throw new Error('Please provide an OrderCompletion model.');
    }
  }

  className() {
    return 'completeOrderForm rowLg';
  }

  // events() {
  //   return {
  //     'click .js-copyTrackingNumber': 'onClickCopyTrackingNumber',
  //   };
  // }

  // get $trackingCopiedToClipboard() {
  //   return this._$copiedToClipboard ||
  //     (this._$copiedToClipboard = this.$('.js-trackingCopiedToClipboard'));
  // }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/completeOrderForm.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));

      // this._$copiedToClipboard = null;
    });

    return this;
  }
}
