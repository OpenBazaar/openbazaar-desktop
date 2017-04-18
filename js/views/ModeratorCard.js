import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import Profile from '../models/profile/Profile';
import { launchModeratorDetailsModal } from '../utils/modalManager';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.notSelected = options.notSelected || 'unselected';
    this.cardState = options.cardState || this.notSelected;

    if (!this.model || !(this.model instanceof Profile)) {
      throw new Error('Please provide a Profile model.');
    }
  }

  className() {
    return 'moderatorCard';
  }

  events() {
    return {
      'click .js-moderatorCard': 'clickModerator',
      'click .js-selectBtn': 'clickSelectBtn',
    };
  }

  clickModerator() {
    const modModal = launchModeratorDetailsModal({
      model: this.model,
      purchase: this.options.purchase,
      cardState: this.cardState,
    });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.changeSelectState('selected');
      this.trigger('changeModerator', { selected: true, guid: this.model.id });
    });
  }

  clickSelectBtn(e) {
    e.stopPropagation();

    if (this.cardState === 'selected') {
      this.changeSelectState(this.notSelected);
      this.trigger('changeModerator', { selected: false, guid: this.model.id });
    } else {
      this.changeSelectState('selected');
      this.trigger('changeModerator', { selected: true, guid: this.model.id });
    }
  }

  changeSelectState(cardState) {
    this.cardState = cardState;
    this.$selectBtn.attr('data-state', cardState);
  }

  render() {
    loadTemplate('moderatorCard.html', (t) => {
      this.$el.html(t({
        cardState: this.cardState,
        displayCurrency: app.settings.get('localCurrency'),
        ...this.model.toJSON(),
      }));

      this.$selectBtn = this.$('.js-selectBtn');
    });

    return this;
  }
}
