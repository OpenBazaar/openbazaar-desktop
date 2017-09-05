import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import General from './General';
import Page from './Page';
import Store from './Store';
import Addresses from './Addresses';
import Advanced from './advanced/Advanced';
import Moderation from './Moderation';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      removeOnRoute: false,
      initialTab: 'General',
      scrollTo: '',
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      General,
      Page,
      Store,
      Addresses,
      Advanced,
      Moderation,
    };

    this.listenTo(app.router, 'will-route', () => {
      this.close(true);
      this.remove();
    });
  }

  className() {
    return `${super.className()} settings tabbedModal modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      ...super.events(),
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');

    this.selectTab(targ);
  }

  selectTab(targ, options = {}) {
    const tabViewName = targ.data('tab');
    let tabView = this.tabViewCache[tabViewName];

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        tabView = this.createChild(this.tabViews[tabViewName]);
        this.tabViewCache[tabViewName] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;

      if (options.scrollTo && typeof tabView.scrollTo === 'function') {
        setTimeout(() => tabView.scrollTo(options.scrollTo));
      }
    }
  }

  render() {
    loadTemplate('modals/settings/settings.html', (t) => {
      this.$el.html(t(this.options));
      super.render();

      this.$tabContent = this.$('.js-tabContent');

      this.selectTab(this.$(`.js-tab[data-tab="${this.options.initialTab}"]`), {
        scrollTo: this.options.scrollTo,
      });
    });

    return this;
  }
}

