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
      'click .js-viewBtn': 'clickModerator',
      'click .js-moderatorCard': 'clickSelectBtn',
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
    });
  }

  clickSelectBtn(e) {
    e.stopPropagation();
    this.rotateSelectState();
  }

  rotateSelectState() {
    if (this.cardState === 'selected' && !this.options.radioStyle) {
      this.changeSelectState(this.notSelected);
    } else {
      this.changeSelectState('selected');
    }
  }

  changeSelectState(cardState) {
    if (cardState !== this.cardState) {
      this.cardState = cardState;
      this.$selectBtn.attr('data-state', cardState);
      this.trigger('changeModerator', {
        selected: cardState === 'selected',
        guid: this.model.id,
      });
    }
  }

  render() {
    loadTemplate('moderatorCard.html', (t) => {
      this.$el.html(t({
        cardState: this.cardState,
        displayCurrency: app.settings.get('localCurrency'),
        valid: this.model.isModerator,
        radioStyle: this.options.radioStyle || false,
        ...this.model.toJSON(),
      }));

      this.$selectBtn = this.$('.js-selectBtn');
    });

    return this;
  }
}
