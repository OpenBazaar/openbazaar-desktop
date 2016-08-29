import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Home from './UserPageHome';
import Store from './UserPageStore';
import Follow from './UserPageFollow';
import Reputation from './UserPageReputation';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.tab = options.tab || 'Home';
    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow, Reputation };

    this.ownPage = this.model.id === app.profile.id;

    if (!this.ownPage) {
      this.listenTo(app.ownFollowing, 'sync, update', () => {
        this.followed = app.ownFollowing.where({ guid: this.model.id }).length > 0;
        if (this.followed) {
          this.$followLbl.addClass('hide');
          this.$unfollowLbl.removeClass('hide');
        } else {
          this.$followLbl.removeClass('hide');
          this.$unfollowLbl.addClass('hide');
        }
      });

      this.listenTo(app.ownFollowers, 'sync, update', () => {
        this.followsYou = app.ownFollowers.where({ guid: app.profile.id }).length > 0;
        if (this.followsYou) {
          this.$followsYou.removeClass('hide');
        } else {
          this.$followsYou.addClass('hide');
        }
      });
    }
  }

  className() {
    return 'userPage';
  }

  events() {
    return {
      'click .js-tab': 'tabClick',
      'click .js-followBtn': 'followClick',
      'click .js-messageBtn': 'messageClick',
      'click .js-moreBtn': 'moreClick',
    };
  }

  tabClick(e) {
    const targ = $(e.target).closest('.js-tab');
    this.selectTab(targ.attr('data-tab'));
  }

  followClick() {
    const type = this.followed ? 'unfollow' : 'follow';

    app.followUnfollow(this.model.id, type);
  }

  messageClick() {
    // activate the chat message
    console.log('message');
  }

  moreClick() {
    this.$moreableBtns.toggleClass('hide');
  }

  selectTab(targ) {
    let tabView = this.tabViewCache[targ];
    const tabOptions = { ownPage: this.ownPage, model: this.model };

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$tabTitle.text(targ);
      // add tab to history
      app.router.navigate(`${this.model.id}/${targ}`, {
        trigger: false,
        replace: false,
      });

      this.$('.js-tab').removeClass('clrT active');
      this.$(`.js-tab[data-tab="${targ}"]`).addClass('clrT active');

      if (targ === 'Followers' || targ === 'Following') {
        tabOptions.followType = targ;
        targ = 'Follow'; // eslint-disable-line no-param-reassign
      }

      if (this.currentTabView) this.currentTabView.$el.detach();
      if (!tabView) {
        tabView = this.createChild(this.tabViews[targ], tabOptions);
        this.tabViewCache[tabOptions.followType || targ] = tabView;
        tabView.render();
      }
      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  render() {
    loadTemplate('userPage/userPage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        tab: this.options.tab || '',
        category: this.options.category || '',
        layer: this.options.layer || '',
        followed: this.followed,
        followsYou: this.followsYou,
        ownPage: this.ownPage,
      }));

      this.$tabContent = this.$('.js-tabContent');
      this.$tabTitle = this.$('.js-tabTitle');
      this.$followLbl = this.$('.js-followLbl');
      this.$unfollowLbl = this.$('.js-unfollowLbl');
      this.$followsYou = this.$('.js-followsYou');
      this.$moreableBtns = this.$('.js-moreableBtn');

      this.selectTab(this.tab);
    });

    return this;
  }
}
