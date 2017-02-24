import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import Profile from '../models/profile/Profile';
import { launchModeratorDetailsModal } from '../utils/modalManager';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.state = 'view';

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
      'click .js-selectBtn': 'clickSelectBtn',
    };
  }

  viewDetails() {
    const modModal = launchModeratorDetailsModal({ model: this.model });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.trigger('changeModerator', { selected: true, guid: this.model.id });
    });
  }

  render() {
    loadTemplate('moderatorCard.html', (t) => {
      this.$el.html(t({
        state: this.state,
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
