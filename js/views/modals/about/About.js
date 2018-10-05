import { version } from '../../../../package.json';
import { remote, ipcRenderer } from 'electron';
import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Story from './Story';
import Contributors from './Contributors';
import Donations from './Donations';
import Help from './Help';
import License from './License';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      initialTab: 'Story',
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
      Help,
    };

    this.currentTabName = opts.initialTab;
    this.isBundledApp = remote.getGlobal('isBundledApp');
    this.updatesSupported = remote.getGlobal('updatesSupported');
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

    if (!tabView && !this.tabViews[tabViewName]) {
      throw new Error('You are attempting to select an invalid tab.');
    }

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
    ipcRenderer.send('checkForUpdate');
  }

  render() {
    loadTemplate('modals/about/about.html', (t) => {
      loadTemplate('components/brandingBox.html', brandingBoxT => {
        this.$el.html(t({
          brandingBoxT,
          serverVersion: app.settings.prettyServerVer,
          ...this.options,
          version,
          isBundledApp: this.isBundledApp,
          updatesSupported: this.updatesSupported,
        }));
        super.render();

        this.$tabContent = this.$('.js-tabContent .contentBox');
        this.selectTab(this.currentTabName);
      });
    });

    return this;
  }
}

