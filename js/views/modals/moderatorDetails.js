import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.model = this.options.model;
  }

  className() {
    return `${super.className()} moderatorDetails modalTop modalScrollPage modalNarrow`;
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
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));
      super.render();
    });

    return this;
  }
}

