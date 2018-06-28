import $ from 'jquery';
import _ from 'underscore';
import loadTemplate from '../../utils/loadTemplate';
import { clipboard } from 'electron';
import BaseVw from '../baseVw';
import app from '../../app';
import UserCard from '../UserCard';
import { launchModeratorDetailsModal } from '../../utils/modalManager';
import { openSimpleMessage } from '../modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.ownPage = options.ownPage;

    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => {
      app.settings.set(this.settings.toJSON());
    });

  }

  className() {
    return 'userPagePosts';
  }

  events() {
    return {
      // 'click .js-guid': 'guidClick',
      // 'mouseleave .js-guid': 'guidLeave',
    };
  }

  render() {
    loadTemplate('userPage/posts.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));

    });

    return this;
  }
}

