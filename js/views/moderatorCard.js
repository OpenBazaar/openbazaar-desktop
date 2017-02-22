import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import Profile from '../models/profile/Profile';
import { launchModeratorDetailsModal } from '../utils/modalManager';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Profile)) {
      throw new Error('Please provide a Profile model.');
    }
  }

  className() {
    return 'moderatorCard';
  }

  events() {
    return {
      'click .js-moderatorCard': 'viewDetails',
    };
  }

  viewDetails() {
    console.log('click moderator');
    launchModeratorDetailsModal();
  }

  render() {
    loadTemplate('moderatorCard.html', (t) => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
