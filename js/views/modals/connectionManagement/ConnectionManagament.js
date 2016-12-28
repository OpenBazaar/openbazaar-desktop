import $ from 'jquery';
import app from '../../../app';
import { events as serverConnectEvents } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Configurations from './Configurations';
import NewConfiguration from './NewConfiguration';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      // debugLog: remote.getGlobal('serverLog'),
      // autoUpdate: true,
      initialTabView: 'Configurations',
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      Configurations,
      NewConfiguration,
    };

    // this.listenTo(serverConnectEvents, 
  }

  className() {
    return `${super.className()} connectionManagement tabbedModal modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'onTabClick',
      ...super.events(),
    };
  }

  get closeClickTargets() {
    return [
      ...this.$closeClickTargets.get(),
      ...super.closeClickTargets,
    ];
  }

  onTabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ);
  }

  createConfigurationsTabView() {
    return this.createChild(Configurations, {
      collection: app.serverConfigs,
    });
  }

  selectTab(targ) {
    const tabViewName = targ.data('tab');
    let tabView = this.tabViewCache[tabViewName];

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        if (this[`create${tabViewName}TabView`]) {
          tabView = this[`create${tabViewName}TabView`].apply(this);
        } else {
          tabView = this.createChild(this.tabViews[tabViewName]);
        }

        this.tabViewCache[tabViewName] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  get $closeClickTargets() {
    return this._$closeClickTargets ||
      (this._$closeClickTargets = this.$('.js-closeClickTarget'));
  }

  render() {
    loadTemplate('modals/connectionManagement/connectionManagement.html', t => {
      this.$el.html(t());
      super.render();

      this.$tabContent = this.$('.js-tabContent');
      this._$closeClickTargets = null;

      this.selectTab(this.$(`[data-tab="${this.options.initialTabView}"]`));
    });

    return this;
  }
}
