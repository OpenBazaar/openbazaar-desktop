import _ from 'underscore';
import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Profile from '../../models/profile/Profile';
import VerifiedMod, { getModeratorOptions } from './VerifiedMod';
import { handleLinks } from '../../utils/dom';
import { launchModeratorDetailsModal } from '../../utils/modalManager';
import { anySupportedByWallet } from '../../data/walletCurrencies';
import { getLangByCode } from '../../data/languages';

export default class extends BaseVw {
  constructor(options = {}) {
    /* There are 3 valid card selected states:
     selected: This mod is pre-selected, or was activated by the user.
     unselected: Neutral. No action has been taken by the user on this mod.
     deselected: The user has rejected or turned off this mod.
     */
    const selectedState = options.initialState.selectedState;
    const validSelectedStates = ['selected', 'unselected', 'deselected'];

    if (!validSelectedStates.includes(selectedState)) {
      throw new Error('This card does not have a valid selected state.');
    }

    const opts = {
      radioStyle: false,
      controlsOnInvalid: false,
      notSelected: 'unselected',
      checkPreferredCurs: false,
      ...options,
      initialState: {
        selectedState,
        preferredCurs: [],
        ...options.initialState,
      },
    };

    super(opts);
    this.options = opts;

    if (!this.model || !(this.model instanceof Profile)) {
      throw new Error('Please provide a Profile model.');
    }

    const modInfo = this.model.get('moderatorInfo');
    this.modCurs = modInfo && modInfo.get('acceptedCurrencies') || [];

    this.modLanguages = [];
    if (this.model.isModerator) {
      this.modLanguages = this.model.get('moderatorInfo')
        .get('languages')
        .map(lang => {
          const langData = getLangByCode(lang);
          return langData && langData.name || lang;
        });
    }

    handleLinks(this.el);
  }

  className() {
    return 'moderatorCard clrBr';
  }

  events() {
    return {
      'click .js-viewBtn': 'clickModerator',
      click: 'click',
    };
  }

  clickModerator(e) {
    e.stopPropagation();
    const modModal = launchModeratorDetailsModal({
      model: this.model,
      purchase: this.options.purchase,
      cardState: this.getState('selectedState'),
    });
    this.listenTo(modModal, 'addAsModerator', () => {
      this.changeSelectState('selected');
    });
  }

  click(e) {
    e.stopPropagation();
    this.rotateSelectState();
  }

  get hasValidCurrency() {
    return anySupportedByWallet(this.modCurs);
  }

  get hasPreferredCur() {
    const preCur = _.intersection(this.getState().preferredCurs, this.modCurs);
    return !!preCur.length;
  }

  rotateSelectState() {
    if (this.getState().selectedState === 'selected' && !this.options.radioStyle) {
      this.changeSelectState(this.notSelected);
    } else if (this.model.isModerator && this.hasValidCurrency) {
      /* Only change to selected if this is a valid moderator and the user's currency is supported.
      Moderators that have become invalid may be displayed, and can be de-selected to remove them.
      */
      this.changeSelectState('selected');
    }
  }

  changeSelectState(newSelectedState) {
    if (newSelectedState !== this.getState().selectedState) {
      this.setState({ selectedState: newSelectedState });
      this.trigger('modSelectChange', {
        selected: newSelectedState === 'selected',
        guid: this.model.id,
      });
    }
  }

  render() {
    super.render();

    const showPreferredWarning = this.options.checkPreferredCurs &&
      !this.hasPreferredCur;

    const verifiedMod = app.verifiedMods.get(this.model.get('peerID'));

    loadTemplate('components/moderatorCard.html', (t) => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
        valid: this.model.isModerator,
        hasValidCurrency: this.hasValidCurrency,
        radioStyle: this.options.radioStyle,
        controlsOnInvalid: this.options.controlsOnInvalid,
        showPreferredWarning,
        verified: !!verifiedMod,
        modLanguages: this.modLanguages,
        ...this.model.toJSON(),
        ...this.getState(),
      }));

      if (this.verifiedMod) this.verifiedMod.remove();

      this.verifiedMod = this.createChild(VerifiedMod, getModeratorOptions({
        model: verifiedMod,
      }));
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
    });

    return this;
  }
}
