import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import SettingsGeneral from './SettingsGeneral';
import SettingsPage from './SettingsPage';
import $ from 'jquery';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP border clrBr',
      ...options,
    };

    super(opts);
    this.options = opts;

    this.currentTabView = '';
    this.TabViews = { SettingsGeneral, SettingsPage };

    if (this.options.removeOnClose) this.on('close', () => this.remove());
  }

  className() {
    return `${super.className()} settings`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      'click .js-cancel': 'cancelClick',
      'click .js-save': 'saveClick',
      ...super.events(),
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ);
  }

  selectTab(targ) {
    const targTab = targ.data('tab');
    const TabView = `Settings${targTab}`;
    let newTabView;

    this.$('.js-tab').removeClass('clrT active');
    targ.addClass('clrT active');

    if (this.TabViews[TabView]) {
      newTabView = this[TabView] || new this.TabViews[TabView]();
      if (this.currentTabView) this.currentTabView.remove();
      this.currentTabView = newTabView;
      this.tabContent.append(newTabView.render().el);
    }
  }

  cancelClick() {
    this.cancel();
  }

  cancel() {
    this.currentTabView.cancel();
  }

  saveClick() {
    this.save();
  }

  save() {
    this.currentTabView.save();
  }

  render() {
    loadTemplate('modals/settings/settings.html', (t) => {
      this.$el.html(t(this.options));

      super.render();

      this.tabContent = this.$('.js-tabContent');
      this.selectTab(this.$('.js-tab[data-tab="General"]'));
    });

    return this;
  }
}

