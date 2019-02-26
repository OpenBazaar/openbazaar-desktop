import app from '../app';
import { followsYou } from '../utils/follow';
import { isBlocked, events as blockEvents } from '../utils/block';
import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      fetchFollowsYou: true,
      onClickRating:
        () => app.router.navigate(`ob://${options.model.id}/reputation`, { trigger: true }),
      ...options,
    };

    super(opts);
    this.options = opts;
    if (!this.model) {
      throw new Error('Please provide a profile model.');
    }

    this._state = {
      followsYou: false,
      ...options.initialState || {},
    };

    this._followsYou = false;

    if (this.model.id === app.profile.id) {
      this.listenTo(app.profile, 'change:name change:location', () => this.render());
      this.listenTo(app.profile.get('avatarHashes'), 'change', () => this.render());
    } else {
      if (opts.fetchFollowsYou) {
        followsYou(this.model.id).done(data => {
          this.setState({ followsYou: data.followsMe });
        });
      }

      this.listenTo(app.ownFollowers, 'add', md => {
        if (md.id === app.profile.id) {
          this.setState({ followsYou: true });
        }
      });

      this.listenTo(app.ownFollowers, 'remove', md => {
        if (md.id === app.profile.id) {
          this.setState({ followsYou: false });
        }
      });
    }

    this.listenTo(blockEvents, 'blocked unblocked', data => {
      if (data.peerIds.includes(this.model.id)) {
        this.setBlockedClass();
      }
    });
  }

  className() {
    return 'miniprofile';
  }

  events() {
    return {
      'click .js-rating': 'onClickRating',
    };
  }

  onClickRating() {
    this.options.onClickRating();
  }

  setBlockedClass() {
    this.$el.toggleClass('isBlocked', isBlocked(this.model.id));
  }

  render() {
    loadTemplate('miniProfile.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
      }));

      this.setBlockedClass();
    });

    return this;
  }
}
