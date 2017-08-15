import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import Followers from '../../collections/Followers';
import BaseVw from '../baseVw';
import FollowLoading from './FollowLoading';
import UserCard from '../UserCard';
// import { followedByYou, followsYou } from '../../utils/follow';
// import { openSimpleMessage } from '../modals/SimpleMessage';

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

    this.options = options;
    this.userCardViews = [];
    this.renderedCl = new Followers([], {
      peerId: opts.peerId,
      type: opts.followType,
    });
    this.listenTo(this.renderedCl, 'update', this.onCollectionUpdate);

    if (this.collection === app.ownFollowing) {
      this.onCollectionFetched.call(this);
    } else {
      this.fetch();
    }
  }

  className() {
    return 'userPageFollow flexRow noResults';
  }

  get userPerPage() {
    return 12;
  }

  get ownPage() {
    return this.options.peerId === app.profile.id;
  }

  onCollectionUpdate(cl, opts) {
    this.$el.toggleClass('noResults', !cl.length);

    if (opts.changes.added.length) {
      // Expecting either a single new user on the bottom (own node
      // must have followed in the UI) or a page of users at the bottom.
      if (opts.changes.added[opts.changes.added.length - 1] ===
        this.renderedCl.at(0)) {
        // It's a page of users at the bottom
        this.renderUsers(opts.changes.added, 'append');
      } else {
        // New user at top
        this.renderUsers(opts.changes.added, 'prepend');
      }
    } else if (opts.changes.removed.length) {
      console.log('removal yo');
      window.removal = opts;
    }
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
    this.renderedCl.add(this.collection.toJSON().slice(0, this.userPerPage));

    // If our own node follows / unfollows the user of this page we'll add / remove
    // ourselves from the main collection. Here we'll ensure the renderedCl is kept
    // in sync with that.
    this.listenTo(this.collection, 'add', md => {
      this.renderedCl.add(md, { at: this.collection.models.indexOf(md) });
    });

    this.listenTo(this.collection, 'remove', md => {
      this.renderedCl.remove(md.id);
    });
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

    return this;
  }
}

