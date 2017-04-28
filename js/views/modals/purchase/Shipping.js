import '../../../lib/select2';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Listing from '../../../models/listing/Listing';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, updateOpts) => {
        if (updateOpts.changes.added.length ||
          updateOpts.changes.removed.length) {
          // update the shipping section with the changed address information
          // TODO: add shipping code here
        }
      });
  }

  className() {
    return 'shipping';
  }

  events() {
    return {
    };
  }

  render() {
    loadTemplate('modals/purchase/shipping.html', t => {
      this.$el.html(t({
      }));
    });

    return this;
  }
}
