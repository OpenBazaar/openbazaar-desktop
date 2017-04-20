import $ from 'jquery';
import app from '../../../app';
import serverConnect from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import ServerConfig from '../../../models/ServerConfig';
import BaseModal from '../BaseModal';
import Configurations from './Configurations';
import ConfigurationForm from './ConfigurationForm';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      initialTabView: 'Configurations',
      ...options,
    };

    super(opts);
    this.options = opts;

    this.tabViewCache = {};
    this.tabViews = {
      Configurations,
      ConfigurationForm,
    };
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
    this.selectTab(targ.data('tab'), targ);
  }

  createConfigurationsTabView() {
    const configTab = this.createChild(Configurations, {
      collection: app.serverConfigs,
    });

    this.listenTo(configTab, 'editConfig',
      e => this.selectTab('ConfigForm', { configFormModel: e.model }));
    this.listenTo(configTab, 'newClick', () => this.selectTab('ConfigForm'));

    return configTab;
  }

  createConfigurationFormView(model) {
    if (!model) {
      throw new Error('Please provide a server config model.');
    }

    const configForm = new ConfigurationForm({ model });
    this.listenTo(configForm, 'cancel', () => this.selectTab('Configurations'));
    this.listenTo(configForm, 'saved', () => {
      app.serverConfigs.add(configForm.model, { merge: true });
      this.selectTab('Configurations');
      serverConnect(configForm.model, { attempts: 2 });
    });

    return configForm;
  }

  selectTab(tabViewName, data = {}) {
    let $tabTarg = data.targ;
    let $tabs = null;
    let tabView = this.tabViewCache[tabViewName];

    if (!$tabTarg && !data.configFormModel) {
      // The prescence of data.configFormModel indicates we are showing the config form
      // in Edit mode and in that case there is no $tabTarg we want to highlight with
      // an active class.
      $tabs = this.$('.js-tab');
      $tabTarg = $tabs.filter(`[data-tab=${tabViewName}]`);
    }

    if (!this.currentTabView || this.currentTabView !== tabView) {
      $tabs = $tabs || this.$('.js-tab');
      $tabs.removeClass('clrT active');
      if ($tabTarg) $tabTarg.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();

      if (tabViewName === 'ConfigForm') {
        // we won't cache the Config Form tab and we'll manage it ourselves
        this.currentTabView =
          this.createConfigurationFormView(data.configFormModel || new ServerConfig());
        this.$tabContent.append(this.currentTabView.render().el);
      } else {
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
  }

  close() {
    this.selectTab('Configurations');
    super.close();
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

      this.selectTab(this.options.initialTabView);
    });

    return this;
  }
}
