import $ from 'jquery';
import _ from 'underscore';
import app from '../app';
import loadTemplate from '../utils/loadTemplate';
import { followedByYou, followUnfollow } from '../utils/follow';

import BaseVw from './baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.targetID) throw new Error('You must provide a targetID');

    super(options);
    this.options = options;

    this._state = {
      following: followedByYou(options.targetID),
      processing: false,
      ...options.initialState || {},
    };

    this.listenTo(app.ownFollowing, 'update', () => {
      this.setState({
        following: followedByYou(options.targetID),
      });
    });
  }

  className() {
    return 'socialBtns';
  }

  events() {
    return {
      'click .js-followUnfollowBtn': 'onClickFollow',
      'click .js-messageBtn': 'onClickMessage',
    };
  }

  onClickMessage() {
    // activate the chat message
    app.chat.openConversation(this.options.targetID);
  }

  onClickFollow() {
    const type = this._state.following ? 'unfollow' : 'follow';
    this.setState({ processing: true });
    this.folCall = followUnfollow(this.options.targetID, type)
      .always(() => {
        if (this.isRemoved()) return;
        this.setState({ processing: false });
      });
  }

  render() {
    loadTemplate('socialBtns.html', (t) => {
      this.$el.html(t({
        ...this.options,
        ...this._state,
      }));
    });

    return this;
  }
}
