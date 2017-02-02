import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Story from './Story';
import Contributors from './Contributors';
import Donations from './Donations';
import License from './License';
import BTCTicker from './BTCTicker';
import { version } from '../../../../package.json';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      Story,
      Contributors,
      Donations,
      License,
    };

    // default about tab is Story
    this.currentTabName = 'Story';
  }

  className() {
    return `${super.className()} about tabbedModal modalTop modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      'click .js-checkForUpdate': 'checkForUpdateClick',
      ...super.events(),
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    const tabName = targ.data('tab');
    this.selectTab(tabName);
  }

  selectTab(tabViewName) {
    let tabView = this.tabViewCache[tabViewName];

    this.$('.js-tab.clrT.active').removeClass('clrT active');
    this.$(`.js-tab[data-tab="${tabViewName}"]`).addClass('clrT active');

    if (!this.currentTabView || this.currentTabView !== tabView) {
      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        tabView = this.createChild(this.tabViews[tabViewName]);
        this.tabViewCache[tabViewName] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
      this.currentTabName = tabViewName;
      this.$('#tabTitle').text(app.polyglot.t(
        `about.${this.currentTabName.toLowerCase()}Tab.sectionHeader`));
    }
  }

  checkForUpdateClick() {
    console.log('checking for an update');
    // TODO: wire this in
  }

  render() {
    // remove any existing tickers from previous renders
    if (this.btcTicker) this.btcTicker.remove();

    this.btcTicker = this.createChild(BTCTicker);
    this.btcTicker.render();

    const sVer = app.settings.get('version');
    const serverVersion = sVer.substring(sVer.lastIndexOf(':') + 1, sVer.lastIndexOf('/'));

    loadTemplate('modals/about/about.html', (t) => {
      this.$el.html(t({
        serverVersion,
        ...this.options,
        version,
      }));
      super.render();

      this.$tabContent = this.$('.js-tabContent .contentBox');

      this.selectTab(this.currentTabName);

      this.$('.js-btcTicker').append(this.btcTicker.$el);
    });

    return this;
  }
}

