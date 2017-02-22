import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} moderatorDetails modalTop modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      ...super.events(),
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    const tabName = targ.data('tab');
    this.selectTab(tabName);
  }

  render() {
    loadTemplate('modals/moderatorDetails.html', (t) => {
      this.$el.html(t({
        ...this.options,
      }));
      super.render();
    });

    return this;
  }
}

