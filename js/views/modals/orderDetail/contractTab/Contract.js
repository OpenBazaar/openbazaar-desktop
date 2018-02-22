import renderjson from '../../../../lib/renderjson';
import BaseVw from '../../../baseVw';
import loadTemplate from '../../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        heading: '',
        errors: [],
        ...options.initialState || {},
      },
    };

    super(options);

    if (!options.contract) {
      throw new Error('Please provide a contract.');
    }

    this.contract = options.contract;
    this.options = opts;
  }

  tagName() {
    return 'section';
  }

  render() {
    let renderjsonEl;

    if (this.rendered) {
      // On re-renders, reuse the renderjson el so it's state (e.g.
      // what is expanded/collapsed) is maintained.
      renderjsonEl = this.$('.js-jsonContractContainer')
        .children()[0];
    }

    loadTemplate('modals/orderDetail/contractTab/contract.html', t => {
      this.$el.html(t({
        ...this.getState(),
      }));

      this.$('.js-jsonContractContainer')
        .html(renderjsonEl || renderjson.set_show_to_level('1')(this.contract));
    });

    this.rendered = true;
    return this;
  }
}
