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

    app.ownFollowers = app.ownFollowers ||
      new Follows(null, { url: app.getServerUrl('ob/followers') });
    app.ownFollowers.fetch();

    app.ownFollowing = app.ownFollowing ||
      new Follows(null, { url: app.getServerUrl('ob/following') });
    app.ownFollowing.fetch();

    this.followers = new Follows(null, {
      url: app.getServerUrl(`ipns/${this.model.id}/followers`),
    });
    this.followers.fetch();

    this.following = new Follows(null, {
      url: app.getServerUrl(`ipns/${this.model.id}/following`),
    });
    this.following.fetch();

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

    this.ownPage = this.model.id === app.profile.id;
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
    const tabViewType = tabViewName; // the original view name is passed in for the Follow view

    this.$tabTitle.text(tabViewName);

    if (tabViewName === 'Followers' || tabViewName === 'Following') tabViewName = 'Follow';

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$('.js-tab').removeClass('clrT active');
      targ.addClass('clrT active');
      if (this.currentTabView) this.currentTabView.$el.detach();
      if (!tabView) {
        tabView = this.createChild(this.tabViews[tabViewName], {
          tabViewType,
          ownPage: this.ownPage,
          model: this.model,
        });
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
