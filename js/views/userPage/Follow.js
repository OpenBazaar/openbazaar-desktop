import _ from 'underscore';
import app from '../../app';
import { getContentFrame } from '../../utils/selectors';
import loadTemplate from '../../utils/loadTemplate';
import Followers from '../../collections/Followers';
import BaseVw from '../baseVw';
import FollowLoading from './FollowLoading';
import UserCard from '../UserCard';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      followType: 'follow',
      ...options,
    };

    super(opts);

    if (!opts.peerId) {
      throw new Error('Please provide a peerId of the user who this list is for.');
    }

    const types = ['followers', 'following'];
    if (types.indexOf(opts.followType) === -1) {
      throw new Error(`followType must be one of ${types.join(', ')}`);
    }

    if (!options.collection) {
      throw new Error('Please provide a followers collection.');
    }

    this._origClParse = this.collection.parse;
    this.collection.parse = this.collectionParse.bind(this);

    this.options = options;
    this.userCardViews = [];
    this.renderedCl = new Followers([], {
      peerId: opts.peerId,
      type: opts.followType,
    });
    this.listenTo(this.renderedCl, 'update', this.onCollectionUpdate);

    if (this.collection === app.ownFollowing) {
      setTimeout(() => this.onCollectionFetched.call(this));
    } else {
      this.fetch();
    }

    this.listenTo(app.ownFollowing, 'update', this.onOwnFollowingUpdate);
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);
  }

  className() {
    return 'userPageFollow noResults';
  }

  get usersPerPage() {
    return 3;
  }

  get ownPage() {
    return this.options.peerId === app.profile.id;
  }

  onScroll() {
    const cf = getContentFrame()[0];
    const scrollNearBot = cf.scrollTop >= cf.scrollHeight - cf.offsetHeight - 100;
    if (this.renderedCl.length < this.collection.length &&
      this.followLoading && !this.followLoading.getState().isFetching &&
      scrollNearBot) {
      // Some fake latency so a user doesn't just scroll down and load
      // hundreds of userCards which would kick off hundreds of profile
      // fetches.
      this.followLoading.setState({ isFetching: true });

      setTimeout(() => {
        const start = this.renderedCl.length;
        const end = start + this.usersPerPage;
        this.followLoading.setState({ isFetching: false });
        this.renderedCl.add(this.collection.models.slice(start, end));
      }, 500);
    }
  }

  onOwnFollowingUpdate(cl, opts) {
    if (opts.changes.added.length) {
      if (this.ownPage) {
        if (this.options.type === 'following') this.collection.add(opts.changes.added);
      } else if (this.options.type === 'followers') {
        const md = app.ownFollowing.get(this.model.id);
        if (md && opts.changes.added.indexOf(md) > -1) {
          this.collection.add(md);
        }
      }
    }

    if (opts.changes.removed.length) {
      // If someone is looking at their own following list, we won't remove the user card of
      // users they've unfollowed. It's likely they're scrolling through their own followers
      // list and cleaning house and since the unfollow process takes a while, it could
      // be chaotic for the cards to just disappear at some later time. The follow button
      // state on the card will correctly reflect that the user is no longer followed.

      if (!this.ownPage && this.options.type === 'followers') {
        if (opts.changes.removed.filter(removedMd => (removedMd.id === this.model.id))) {
          this.collection.remove(this.model.id);
        }
      }
    }
  }

  onCollectionUpdate(cl, opts) {
    this.$el.toggleClass('noResults', !cl.length);

    if (opts.changes.added.length) {
      // Expecting either a single new user on the bottom (own node
      // must have followed in the UI) or a page of users at the bottom.
      if (opts.changes.added[opts.changes.added.length - 1] ===
        this.renderedCl.at(this.renderedCl.length - 1)) {
        // It's a page of users at the bottom
        this.renderUsers(opts.changes.added, 'append');
      } else {
        // New user at top
        this.renderUsers(opts.changes.added, 'prepend');
      }
    }

    opts.changes.removed.forEach(md => this.removeUserCard(md.id));
  }

  onCollectionFetched() {
    const state = {
      isFetching: false,
      fetchFailed: false,
      noResults: false,
      fetchErrorMsg: '',
    };

    if (!this.collection.length) {
      state.noResults = true;
    }

    if (this.followLoading) this.followLoading.setState(state);
    this.renderedCl.add(this.collection.models.slice(0, this.usersPerPage));

    // If any additions / removal occur on the main collection (e.g. this view
    // is showing our own following list and we follow / unfollow someone; this view
    // is showing anothers followers list and our own node has followed / unfollowed
    // that user), we sync them over to the renderedCl.
    this.listenTo(this.collection, 'add', md => {
      this.renderedCl.add(md, { at: this.collection.models.indexOf(md) });
    });

    this.listenTo(this.collection, 'remove', md => {
      this.renderedCl.remove(md.id);
    });
  }

  collectionParse(response) {
    return this._origClParse.call(this.collection, response);
  }

  removeUserCard(peerId) {
    if (!peerId) {
      throw new Error('Please provide a peerId');
    }

    const view = this.userCardViews.find(vw => vw.guid === peerId);
    if (view) {
      view.remove();
      this.userCardViews.splice(this.userCardViews.indexOf(view), 1);
    }
  }

  renderUsers(models = [], insertionType = 'append') {
    if (!models) {
      throw new Error('Please provide an array of Follower models.');
    }

    if (['append', 'prepend', 'replace'].indexOf(insertionType) === -1) {
      throw new Error('Please provide a valid insertion type.');
    }

    if (insertionType === 'replace') {
      this.userCardViews.forEach(user => user.remove());
      this.userCardViews = [];
    }

    const usersFrag = document.createDocumentFragment();

    models.forEach(user => {
      const view = this.createChild(UserCard, { guid: user.id });
      this.userCardViews.push(view);
      view.render().$el.appendTo(usersFrag);
    });

    if (insertionType === 'prepend') {
      this.getCachedEl('.js-userCardsContainer').prepend(usersFrag);
    } else {
      this.getCachedEl('.js-userCardsContainer').append(usersFrag);
    }
  }

  fetch() {
    if (this.fetchCall && this.fetchCall.state() === 'pending') {
      return this.fetchCall;
    }

    if (this.followLoading) {
      this.followLoading.setState({
        isFetching: true,
        fetchFailed: false,
        fetchErrorMsg: '',
      });
    }

    this.fetchCall = this.collection.fetch()
      .done((list, txtStatus, xhr) => {
        if (xhr.statusText === 'abort') return;
        this.onCollectionFetched.call(this);
      }).fail(xhr => {
        if (this.followLoading) {
          this.followLoading.setState({
            isFetching: false,
            fetchFailed: true,
            fetchErrorMsg: xhr.responseJSON && xhr.responseJSON.reason || '',
          });
        }
      });

    return this.fetchCall;
  }

  remove() {
    if (this.fetchCall) this.fetchCall.abort();
  }

  render() {
    super.render();

    loadTemplate('userPage/follow.html', (t) => {
      this.$el.html(t({}));
    });

    if (this.followLoading) this.followLoading.remove();
    let noResultsMsg;
    let fetchErrorTitle;

    if (this.options.type === 'follow') {
      fetchErrorTitle = app.polyglot.t('userPage.followTab.followersFetchError');
      noResultsMsg = this.ownPage ?
        app.polyglot.t('userPage.followTab.noOwnFollowers') :
        app.polyglot.t('userPage.followTab.noFollowers', {
          name: this.model.get('handle') || `${this.model.id.slice(0, 8)}…`,
        });
    } else {
      fetchErrorTitle = app.polyglot.t('userPage.followTab.followingFetchError');
      noResultsMsg = this.ownPage ?
        app.polyglot.t('userPage.followTab.noOwnFollowing') :
        app.polyglot.t('userPage.followTab.noFollowing', {
          name: this.model.get('handle') || `${this.model.id.slice(0, 8)}…`,
        });
    }

    this.followLoading = this.createChild(FollowLoading, {
      initialState: {
        isFetching: this.fetchCall && this.fetchCall.state() === 'pending',
        fetchFailed: this.fetchCall && this.fetchCall.state() === 'rejected',
        fetchErrorTitle,
        fetchErrorMsg: this.fetchCall && this.fetchCall.responseJSON &&
          this.fetchCall.responseJSON.reason || '',
        noResultsMsg,
        noResults: !this.collection.length,
      },
    });

    this.listenTo(this.followLoading, 'retry-click', () => this.fetch());
    this.getCachedEl('.js-followLoadingContainer').html(this.followLoading.render().el);

    getContentFrame().off('scroll', this.throttledOnScroll)
      .on('scroll', this.throttledOnScroll);

    return this;
  }
}

