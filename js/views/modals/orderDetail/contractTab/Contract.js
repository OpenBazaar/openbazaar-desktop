import renderjson from '../../../../lib/renderjson';
import BaseVw from '../../../baseVw';
import loadTemplate from '../../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      heading: '',
      errors: [],
      ...options,
    };

    super(options);

    if (!options.contract) {
      throw new Error('Please provide a contract.');
    }

    this.contract = options.contract;
    this.options = opts || {};
  }

  render() {
    loadTemplate('modals/orderDetail/contractTab/contract.html', t => {
      this.$el.html(t({
        ...this.options,
      }));

      this.$('.js-jsonContractContainer')
        .html(renderjson.set_show_to_level(1)(this.contract));
    });

    return this;
  }
}
