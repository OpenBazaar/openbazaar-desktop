import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Home from './UserPageHome';
import Store from './UserPageStore';
import Follow from './UserPageFollow';
import Reputation from './UserPageReputation';
import Follows from '../../collections/Follows';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow, Reputation };

    this.ownPage = this.model.id === app.profile.id;

    if (!this.ownPage) {
      this.followers = new Follows(null, {
        type: 'followers',
        guid: this.model.id,
      });
      this.followers.fetch();

      this.following = new Follows(null, {
        type: 'following',
        guid: this.model.id,
      });
      this.following.fetch();
    } else {
      this.followers = app.ownFollowers;
      this.following = app.ownFollowing;
    }

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
    this.selectTab(targ);
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
    let tabViewName = targ.data('tab');
    let tabView = this.tabViewCache[tabViewName];
    const tabOptions = { ownPage: this.ownPage, model: this.model };

    this.$tabTitle.text(tabViewName);

    if (tabViewName === 'Followers' || tabViewName === 'Following') {
      tabViewName = 'Follow';
      tabOptions.followType = tabViewName;
      tabOptions.followArray = this[tabViewName.toLowerCase()];
    }

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();
      if (!tabView) {
        tabView = this.createChild(this.tabViews[tabViewName], tabOptions);
        this.tabViewCache[tabViewName] = tabView;
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

      this.selectTab(this.$('.js-tab[data-tab="Home"]'));
    });

    return this;
  }
}
