import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Story from './Story';
import Contributors from './Contributors';
import Donations from './Donations';
import License from './License';

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
  }

  className() {
    return `${super.className()} about tabbedModal modalTop modalScrollPage`;
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      ...super.events(),
    };
  }

  get closeClickTargets() {
    return [
      ...this.$closeClickTargets.get(),
      ...super.closeClickTargets,
    ];
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');

    this.selectTab(targ);
  }

  selectTab(targ) {
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
    }
  }

  get $closeClickTargets() {
    return this._$closeClickTargets ||
      (this._$closeClickTargets = this.$('.js-closeClickTarget'));
  }

  render() {
    const tabTitle = 'Hello World!';
    loadTemplate('modals/about/about.html', (t) => {
      this.$el.html(t({
        ...this.options,
        tabTitle,
      }));
      super.render();

      this.$tabContent = this.$('.js-tabContent .contentBox');
      this._$closeClickTargets = null;

      // default About tab
      this.selectTab(this.$('.js-tab[data-tab="Story"]'));
    });

    return this;
  }
}

