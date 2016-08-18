import $ from 'jquery';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Home from './UserPageHome';
import Store from './UserPageStore';
import Follow from './UserPageFollow';
import Reputation from './UserPageReputation';
import Dialog from '../modals/Dialog';
import Follows from '../../collections/Follows';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow, Reputation };

    this.followers = new Follows({ url: app.getServerUrl(`ipns/${this.model.id}/followers`) })
      .fetch();
    this.following = new Follows({ url: app.getServerUrl(`ipns/${this.model.id}/following`) })
      .fetch();

    this.followed = false; // TODO check to see if user is followed by the viewer
    this.followsYou = true; // TODO check to see if this user follows the viewer
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

    app.followUnfollow(this.model.id, type)
      .done(() => {
        if (this.followed) {
          this.followed = false;
          this.$followLbl.removeClass('hide');
          this.$unfollowLbl.addClass('hide');
        } else {
          this.followed = true;
          this.$followLbl.addClass('hide');
          this.$unfollowLbl.removeClass('hide');
        }
      })
      .fail((data) => {
        const followFailedDialog = new Dialog({   // eslint-disable-line no-unused-vars
          title: app.polyglot.t('errors.badResult'),
          message: data.responseJSON.reason,
          dismissOnOverlayClick: true,
          dismissOnEscPress: true,
          showCloseButton: true,
        })
          .render()
          .open();
      });
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
      this.$moreableBtns = this.$('.js-moreableBtn');

      this.selectTab(this.$('.js-tab[data-tab="Home"]'));
    });

    return this;
  }
}
