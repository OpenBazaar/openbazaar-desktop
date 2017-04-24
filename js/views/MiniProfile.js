import _ from 'underscore';
import app from '../app';
import { followsYou } from '../utils/follow';
import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      fetchFollowsYou: true,
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a profile model.');
    }

    this._state = {
      followsYou: false,
      ...options.initialState || {},
    };

    this._followsYou = false;

    if (this.model.id === app.profile.id) {
      this.listenTo(app.profile, 'change:name, change:location', () => this.render());
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
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('miniProfile.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
