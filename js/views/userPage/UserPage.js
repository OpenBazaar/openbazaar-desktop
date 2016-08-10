import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Home from './UserPageHome';
import Store from './UserPageStore';
import Follow from './UserPageFollow';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow };
  }

  className() {
    return 'userPage';
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      'click .js-termsLink': 'termsClick',
      'click .js-termsClose': 'termsClose',
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ);
  }

  selectTab(targ) {
    let tabViewName = targ.data('tab');
    let tabView = this.tabViewCache[tabViewName];
    const tabViewType = tabViewName; // the original view name is passed in for the Follow view

    this.$tabTitle.text(tabViewName);

    if (tabViewName === 'Followers' || tabViewName === 'Following') tabViewName = 'Follow';

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();
      if (!tabView) {
        tabView = new this.tabViews[tabViewName]({ tabViewType });
        this.tabViewCache[tabViewName] = tabView;
        tabView.render();
      }
      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  termsClick() {
    this.$termsDisplay.toggleClass('open');
  }

  termsClose() {
    this.$termsDisplay.removeClass('open');
  }

  render() {
    loadTemplate('userPage/userPage.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
        tab: this.options.tab || '',
        category: this.options.category || '',
        layer: this.options.layer || '',
      }));

      this.$tabContent = this.$('.js-tabContent');
      this.$tabTitle = this.$('.js-tabTitle');
      this.selectTab(this.$('.js-tab[data-tab="Home"]'));
      this.$termsDisplay = this.$('.js-termsDisplay');
    });

    return this;
  }
}
