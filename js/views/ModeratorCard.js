import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import Profile from '../models/profile/Profile';
import { launchModeratorDetailsModal } from '../utils/modalManager';
import { getLangByCode } from '../data/languages';


export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.notSelected = options.notSelected || 'unselected';
    this.cardState = options.cardState || this.notSelected;

    /* There are 3 valid card states:
       selected: This mod is pre-selected, or was activated by the user.
       unselected: Neutral. No action has been taken by the user on this mod.
       deselected: The user has rejected or turned off this mod.
     */
    const validCardStates = ['selected', 'unselected', 'deselected'];

    if (!validCardStates.includes(this.cardState)) {
      throw new Error('This card does not have a valid card state.');
    }

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

  clickModerator(e) {
    e.stopPropagation();
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
      this.trigger('modSelectChange', {
        selected: cardState === 'selected',
        guid: this.model.id,
      });
    }
  }

  render() {
    let modLanguages = [];
    if (this.model.isModerator) {
      modLanguages = this.model.get('moderatorInfo')
        .get('languages')
        .map(lang => {
          const langData = getLangByCode(lang);
          return langData && langData.name || lang;
        });
    }

    loadTemplate('moderatorCard.html', (t) => {
      this.$el.html(t({
        cardState: this.cardState,
        displayCurrency: app.settings.get('localCurrency'),
        valid: this.model.isModerator,
        radioStyle: !!this.options.radioStyle,
        controlsOnInvalid: !!this.options.controlsOnInvalid,
        modLanguages,
        ...this.model.toJSON(),
      }));

      this.$selectBtn = this.$('.js-selectBtn');
    });

    return this;
  }
}
