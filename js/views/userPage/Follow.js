import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';
import FollowLoading from './FollowLoading';
// import userShort from '../UserCard';
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

    this.listenTo(this.collection, 'update', this.onCollectionUpdate);

    this.fetch();
  }

  className() {
    return 'userPageFollow flexRow noResults';
  }

  onCollectionUpdate(cl, opts) {
    this.$el.toggleClass('noResults', !cl.length);

    // if (updateOpts.changes.added.length) {
    //   // Expecting either a single new notifcation on the bottom (will
    //   // be rendered on top) or a page of notifications on top (will be
    //   // rendered on the bottom).
    //   if (updateOpts.changes.added[updateOpts.changes.added.length - 1] ===
    //     this.collection.at(0)) {
    //     // It's a page of notifcations at the bottom
    //     this.renderNotifications(updateOpts.changes.added, 'append');
    //   } else {
    //     // New notification at top
    //     this.renderNotifications(updateOpts.changes.added, 'prepend');
    //   }

    //   updateOpts.changes.added.forEach(notif => {
    //     const innerNotif = notif.get('notification');
    //     const types = ['follow', 'moderatorAdd', 'moderatorRemove'];

    //     if (types.indexOf(innerNotif.type) > -1) {
    //       getCachedProfiles([innerNotif.peerId])[0]
    //         .done(profile => {
    //           notif.set('notification', {
    //             ...innerNotif,
    //             handle: profile.get('handle') || '',
    //             avatarHashes: profile.get('avatarHashes') &&
    //               profile.get('avatarHashes').toJSON() || {},
    //           });
    //         });
    //     }
    //   });

    //   this.listFetcher.setState({ noResults: false });
    // }
  }

  get ownPage() {
    return this.options.peerId === app.profile.id;
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

        const state = {
          isFetching: false,
          fetchFailed: false,
          noResults: false,
          fetchErrorMsg: '',
        };

        if (!list.length) {
          state.noResults = true;
        }

        if (this.followLoading) this.followLoading.setState(state);
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
        app.polyglot.t('userPage.followTab.noOwnFollowing');
    } else {
      fetchErrorTitle = app.polyglot.t('userPage.followTab.followingFetchError');
      noResultsMsg = this.ownPage ?
        app.polyglot.t('userPage.followTab.noFollowers') :
        app.polyglot.t('userPage.followTab.noFollowing');
    }

    this.followLoading = this.createChild(FollowLoading, {
      initialState: {
        isFetching: this.fetchCall && this.fetchCall.state() === 'pending',
        fetchFailed: this.fetchCall && this.fetchCall.state() === 'rejected',
        fetchErrorTitle,
        fetchErrorMsg: this.fetchCall && this.fetchCall.responseJSON &&
          this.fetchCall.responseJSON.reason || '',
        noResultsMsg,
      },
    });

    this.listenTo(this.followLoading, 'retry-click', () => this.fetch());
    this.getCachedEl('.js-followLoadingContainer').html(this.followLoading.render().el);

    return this;
  }
}

