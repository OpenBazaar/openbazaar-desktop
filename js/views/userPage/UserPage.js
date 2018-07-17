import $ from 'jquery';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { followsYou } from '../../utils/follow';
import { abbrNum } from '../../utils';
import { capitalize } from '../../utils/string';
import { isHiRez } from '../../utils/responsive';
import { recordEvent } from '../../utils/metrics';
import { launchEditListingModal, launchSettingsModal } from '../../utils/modalManager';
import { isBlocked, events as blockEvents } from '../../utils/block';
import { getCurrentConnection } from '../../utils/serverConnect';
import Listing from '../../models/listing/Listing';
import Listings from '../../collections/Listings';
import Followers from '../../collections/Followers';
import MiniProfile from '../MiniProfile';
import SocialBtns from '../components/SocialBtns';
import Home from './Home';
import Store from './Store';
import Follow from './Follow';
import Reputation from './Reputation';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!options.model) {
      throw new Error('Please provide a user model.');
    }

    this.options = options;
    this.ownPage = this.model.id === app.profile.id;
    this.state = options.state || 'store';
    this.tabViewCache = {};
    this.tabViews = { Home, Store, Follow, Reputation };

    const stats = this.model.get('stats');
    this._followingCount = stats.get('followingCount');
    this._followerCount = stats.get('followerCount');

    if (!this.ownPage) {
      if (this._followerCount === 0 && app.ownFollowing.indexOf(this.model.id) > -1) {
        this._followerCount = 1;
      }
    } else {
      this._followingCount = app.ownFollowing.length;
    }

    this.listenTo(this.model.get('headerHashes'), 'change', () => this.updateHeader());

    this.curConn = getCurrentConnection();

    if (this.curConn && this.curConn.server) {
      this.showStoreWelcomeCallout = !this.curConn.server.get('dismissedStoreWelcome');
    }

    this.listenTo(app.ownFollowing, 'add', this.onOwnFollowingAdd);
    this.listenTo(app.ownFollowing, 'remove', this.onOwnFollowingRemove);

    this.followsYou = false;
    followsYou(this.model.id).done(data => {
      if (this.miniProfile) {
        this.miniProfile.setState({ followsYou: data.followsMe });
      }

      if (this.followingCount === 0 && !this.ownPage) this.followingCount = 1;
    });

    this.listenTo(blockEvents, 'blocked unblocked', data => {
      if (data.peerIds.includes(this.model.id)) {
        this.setBlockedClass();
      }
    });
  }

  className() {
    return 'userPage clrS';
  }

  events() {
    return {
      'click .js-tab': 'clickTab',
      'click .js-moreBtn': 'clickMore',
      'click .js-customize': 'clickCustomize',
      'click .js-createListing': 'clickCreateListing',
      'click .js-closeStoreWelcomeCallout': 'clickCloseStoreWelcomeCallout',
    };
  }

  onOwnFollowingAdd(md) {
    if (this.ownPage) {
      this.followingCount += 1;
    } else if (md.id === this.model.id) {
      this.followerCount += 1;
    }
  }

  onOwnFollowingRemove(md) {
    if (this.ownPage) {
      this.followingCount -= 1;
    } else if (md.id === this.model.id) {
      this.followerCount -= 1;
    }
  }

  clickTab(e) {
    const targ = $(e.target).closest('.js-tab');
    this.setState(targ.attr('data-tab'));
  }

  clickMore() {
    this.$moreableBtns.toggleClass('hide');
  }

  clickCustomize() {
    launchSettingsModal({ initialTab: 'Page' });
  }

  clickCreateListing() {
    recordEvent('Listing_NewFromUserPage');
    const listingModel = new Listing({}, { guid: app.profile.id });

    launchEditListingModal({
      model: listingModel,
    });
  }

  clickCloseStoreWelcomeCallout() {
    if (this.curConn && this.curConn.server) {
      this.curConn.server.save({ dismissedStoreWelcome: true });
      this.getCachedEl('.js-storeWelcomeCallout').remove();
    }
  }

  clickRating() {
    this.setState('reputation');
  }

  get followingCount() {
    return this._followingCount;
  }

  set followingCount(count) {
    if (typeof count !== 'number') {
      throw new Error('Please provide a numeric count.');
    }

    if (count !== this._followingCount) {
      this._followingCount = count;
      this.getCachedEl('.js-followingCount').text(count);
    }
  }

  get followerCount() {
    return this._followerCount;
  }

  set followerCount(count) {
    if (typeof count !== 'number') {
      throw new Error('Please provide a numeric count.');
    }

    if (count !== this._followerCount) {
      this._followerCount = count;
      this.getCachedEl('.js-followerCount').text(count);
    }
  }

  setBlockedClass() {
    this.$el.toggleClass('isBlocked', isBlocked(this.model.id));
  }

  updateHeader() {
    const headerHashes = this.model.get('headerHashes').toJSON();
    const headerHash = isHiRez() ? headerHashes.large : headerHashes.medium;

    if (headerHash) {
      this.$('.js-header').attr('style',
        `background-image: url(${app.getServerUrl(`ob/images/${headerHash}`)}), 
      url('../imgs/defaultHeader.png')`);
    }
  }

  createFollowersTabView(opts = {}) {
    const collection = new Followers([], {
      peerId: this.model.id,
      type: 'followers',
    });

    this.listenTo(collection, 'sync',
      () => (this.followerCount = collection.length));

    return this.createChild(this.tabViews.Follow, {
      ...opts,
      followType: 'followers',
      peerId: this.model.id,
      collection,
    });
  }

  createFollowingTabView(opts = {}) {
    const models = app.profile.id === this.model.id ?
      app.ownFollowing.models : [];
    const collection = new Followers(models, {
      peerId: this.model.id,
      type: 'following',
      fetchCollection: app.profile.id !== this.model.id,
    });

    this.listenTo(collection, 'sync',
      () => (this.followingCount = collection.length));

    return this.createChild(this.tabViews.Follow, {
      ...opts,
      followType: 'following',
      peerId: this.model.id,
      collection,
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

  setState(state, options = {}) {
    if (!state) {
      throw new Error('Please provide a state.');
    }

    this.state = state;
    this.selectTab(state, options);
  }

  selectTab(targ, options = {}) {
    const opts = {
      addTabToHistory: true,
      ...options,
    };

    if (!this.tabViews[capitalize(targ)] && targ !== 'following' && targ !== 'followers') {
      throw new Error(`${targ} is not a valid tab.`);
    }

    let tabView = this.tabViewCache[targ];
    const tabOptions = {
      ownPage: this.ownPage,
      model: this.model,
      ...opts,
    };

    // delete any opts that the tab view(s) wouldn't need
    delete tabOptions.addTabToHistory;

    if (!this.currentTabView || this.currentTabView !== tabView) {
      const tabName = app.polyglot.t(`userPage.tabTitles.${targ}`);
      this.$tabTitle.text(tabName);

      if (opts.addTabToHistory) {
        const listingBaseUrl = this.model.get('handle') ?
          `@${this.model.get('handle')}` : this.model.id;

        // add tab to history
        app.router.navigateUser(`${listingBaseUrl}/${targ.toLowerCase()}`, this.model.id);
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

  remove() {
    if (this.followingFetch) this.followingFetch.abort();
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('userPage/userPage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownPage: this.ownPage,
        showStoreWelcomeCallout: this.showStoreWelcomeCallout,
        followingCount: this.followingCount,
        followerCount: this.followerCount,
      }));

      this.$tabContent = this.$('.js-tabContent');
      this.$tabTitle = this.$('.js-tabTitle');
      this.$moreableBtns = this.$('.js-moreableBtn');
      this._$pageContent = null;
      this._$listingsCount = null;

      if (this.miniProfile) this.miniProfile.remove();
      this.miniProfile = this.createChild(MiniProfile, {
        model: this.model,
        fetchFollowsYou: false,
        onClickRating: () => this.setState('reputation'),
        initialState: {
          followsYou: this.followsYou,
        },
      });
      this.listenTo(this.miniProfile, 'clickRating', this.clickRating);
      this.$('.js-miniProfileContainer').html(this.miniProfile.render().el);

      if (!this.ownPage) {
        if (this.socialBtns) this.socialBtns.remove();
        this.socialBtns = this.createChild(SocialBtns, {
          targetID: this.model.id,
        });
        this.$('.js-socialBtns').append(this.socialBtns.render().$el);
      }

      this.tabViewCache = {}; // clear for re-renders
      this.setState(this.state, {
        addTabToHistory: false,
        listing: this.options.listing,
      });

      this.setBlockedClass();
    });

    return this;
  }
}
