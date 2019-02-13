import $ from 'jquery';
import { clipboard } from 'electron';
import renderjson from '../../../../lib/renderjson';
import '../../../../utils/lib/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

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

  events() {
    return {
      'click .js-copyContract': 'onClickCopyContract',
    };
  }

  onClickCopyContract() {
    clipboard.writeText(JSON.stringify(this.contract, null, 2));
    // Fade the link and make it unclickable, but maintain its position in the DOM.
    this.getCachedEl('.js-copyContract')
      .addClass('unclickable')
      .velocity('stop')
      .velocity({ opacity: 0 })
      .velocity({ opacity: 1 }, {
        delay: 5000,
        complete: (els) => {
          $(els[0]).removeClass('unclickable');
        },
      });
    this.getCachedEl('.js-copyContractDone')
      .velocity('stop')
      .velocity({ opacity: 1 })
      .velocity({ opacity: 0 }, { delay: 5000 });
  }

  render() {
    super.render();

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
