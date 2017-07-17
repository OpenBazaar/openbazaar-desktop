import $ from 'jquery';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { followedByYou, followUnfollow } from '../../utils/follow';
import { abbrNum } from '../../utils';
import { capitalize } from '../../utils/string';
import { isHiRez } from '../../utils/responsive';
import { launchEditListingModal, launchSettingsModal } from '../../utils/modalManager';
import Listing from '../../models/listing/Listing';
import Listings from '../../collections/Listings';
import MiniProfile from '../MiniProfile';
import Home from './Home';
import Store from './Store';
import Follow from './Follow';
import Reputation from './Reputation';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.ownPage = this.model.id === app.profile.id;

    this.state = options.state || 'store';

    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow, Reputation };

    if (!this.ownPage) {
      this.followedByYou = followedByYou(this.model.id);

      this.listenTo(app.ownFollowing, 'sync update', () => {
        this.followedByYou = followedByYou(this.model.id);
        if (this.followedByYou) {
          this.$followLbl.addClass('hide');
          this.$unfollowLbl.removeClass('hide');
        } else {
          this.$followLbl.removeClass('hide');
          this.$unfollowLbl.addClass('hide');
        }
      });
    }

    this.listenTo(this.model.get('headerHashes'), 'change', () => this.updateHeader());
  }

  className() {
    return 'userPage clrS';
  }

  events() {
    return {
      'click .js-tab': 'clickTab',
      'click .js-followBtn': 'clickFollow',
      'click .js-messageBtn': 'clickMessage',
      'click .js-moreBtn': 'clickMore',
      'click .js-customize': 'clickCustomize',
      'click .js-createListing': 'clickCreateListing',
    };
  }

  clickTab(e) {
    const targ = $(e.target).closest('.js-tab');
    this.setState(targ.attr('data-tab'));
  }

  clickFollow() {
    const type = this.followedByYou ? 'unfollow' : 'follow';

    followUnfollow(this.model.id, type);
  }

  clickMessage() {
    // activate the chat message
    app.chat.openConversation(this.model.id);
  }

  clickMore() {
    this.$moreableBtns.toggleClass('hide');
  }

  clickCustomize() {
    launchSettingsModal({ initTab: 'Page' });
  }

  clickCreateListing() {
    const listingModel = new Listing({}, { guid: app.profile.id });

    launchEditListingModal({
      model: listingModel,
    });
  }

  updateHeader() {
    const headerHashes = this.model.get('headerHashes').toJSON();
    const headerHash = isHiRez() ? headerHashes.large : headerHashes.medium;

    if (headerHash) {
      this.$('.js-header').attr('style',
        `background-image: url(${app.getServerUrl(`ipfs/${headerHash}`)}), 
      url('../imgs/defaultHeader.png')`);
    }
  }

  setState(state, options = {}) {
    if (!state) {
      throw new Error('Please provide a state.');
    }

    const opts = {
      updateHistory: true,
      ...options,
    };

    const tabOpts = {
      ...opts,
      addTabToHistory: opts.updateHistory || false,
    };

    delete tabOpts.updateHistory;

    this.state = state;
    this.selectTab(state, tabOpts);
  }

  createFollowersTabView(opts = {}) {
    return this.createChild(this.tabViews.Follow, {
      ...opts,
      followType: 'Followers',
    });
  }

  createFollowingTabView(opts = {}) {
    return this.createChild(this.tabViews.Follow, {
      ...opts,
      followType: 'Following',
    });
  }

  createStoreTabView(opts = {}) {
    this.listings = new Listings([], { guid: this.model.id });

    let listingsCount = this.model.get('listingCount');

    this.listings.on('update', () => {
      if (this.listings.length !== listingsCount) {
        listingsCount = this.listings.length;
        this.$listingsCount.html(abbrNum(listingsCount));
      }
    });

    return this.createChild(this.tabViews.Store, {
      ...opts,
      initialFetch: this.listings.fetch(),
      collection: this.listings,
      model: this.model,
    });
  }

  selectTab(targ, options = {}) {
    const opts = {
      addTabToHistory: true,
      ...options,
    };

    const listingBaseUrl = `@${this.model.get('handle')}` || this.model.id;

    if (!this.tabViews[capitalize(targ)] && targ !== 'following' && targ !== 'followers') {
      throw new Error(`${targ} is not a valid tab.`);
    }

    let tabView = this.tabViewCache[targ];
    const tabOptions = {
      ownPage: this.ownPage,
      model: this.model,
      listingBaseUrl,
      ...opts,
    };

    // delete any opts that the tab view(s) wouldn't need
    delete tabOptions.addTabToHistory;

    if (!this.currentTabView || this.currentTabView !== tabView) {
      this.$tabTitle.text(capitalize(targ));

      if (opts.addTabToHistory) {
        // subRoute is anything after the tab in the route, which is something
        // we want to maintain, e.g:
        // <guid>/<tab>/<slug>/<blah>
        // the subRoute is '/<slug>/<blah>'
        const subRoute = location.hash
          .slice(1)
          .split('/')
          .slice(2)
          .join('/');

        // add tab to history
        app.router.navigate(`${listingBaseUrl}/${targ.toLowerCase()}` +
          `${subRoute ? `/${subRoute}` : ''}`, { replace: true });
      }

      this.$('.js-tab').removeClass('clrT active');
      this.$(`.js-tab[data-tab="${targ}"]`).addClass('clrT active');

      if (this.currentTabView) this.currentTabView.$el.detach();

      if (!tabView) {
        if (this[`create${capitalize(targ)}TabView`]) {
          tabView = this[`create${capitalize(targ)}TabView`](tabOptions);
        } else {
          tabView = this.createChild(this.tabViews[capitalize(targ)], tabOptions);
        }

        this.tabViewCache[targ] = tabView;
        tabView.render();
      }

      this.$tabContent.append(tabView.$el);
      this.currentTabView = tabView;
    }
  }

  get $pageContent() {
    return this._$pageContent ||
      (this._$pageContent = this.$('.js-pageContent'));
  }

  get $listingsCount() {
    return this._$listingsCount ||
      (this._$listingsCount = this.$('.js-listingsCount'));
  }

  render() {
    loadTemplate('userPage/userPage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        followed: this.followedByYou,
        ownPage: this.ownPage,
      }));

      this.$tabContent = this.$('.js-tabContent');
      this.$tabTitle = this.$('.js-tabTitle');
      this.$followLbl = this.$('.js-followLbl');
      this.$unfollowLbl = this.$('.js-unfollowLbl');
      this.$moreableBtns = this.$('.js-moreableBtn');
      this._$pageContent = null;
      this._$listingsCount = null;

      if (this.miniProfile) this.miniProfile.remove();
      this.miniProfile = this.createChild(MiniProfile, {
        model: this.model,
      });
      this.$('.js-miniProfileContainer').html(this.miniProfile.render().el);

      this.tabViewCache = {}; // clear for re-renders
      this.setState(this.state, {
        updateHistory: false,
        listing: this.options.listing,
      });
    });

    return this;
  }
}
