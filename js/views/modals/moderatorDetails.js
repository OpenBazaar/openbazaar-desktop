import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Profile from '../../models/profile/Profile';
import SocialBtns from '../components/SocialBtns';
import BaseModal from './BaseModal';
import { getLangByCode } from '../../data/languages';
import VerifiedMod, { getModeratorOptions } from '../components/VerifiedMod';
import SupportedCurrenciesList from '../components/SupportedCurrenciesList';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;

    if (!this.model || !(this.model instanceof Profile)) {
      throw new Error('Please provide a Profile model.');
    }

    this.verifiedModModel = app.verifiedMods.get(this.model.get('peerID'));

    this.listenTo(app.verifiedMods, 'update', () => {
      const newVerifiedModModel = app.verifiedMods.get(this.model.get('peerID'));
      if (newVerifiedModModel !== this.verifiedModModel) {
        this.verifiedModModel = newVerifiedModModel;
        this.render();
      }
    });
  }

  className() {
    return `${super.className()} moderatorDetails modalTop modalScrollPage modalNarrow`;
  }

  events() {
    return {
      'click .js-addAsModerator': 'addAsModerator',
      ...super.events(),
    };
  }

  addAsModerator() {
    this.trigger('addAsModerator');
    this.close();
  }

  render() {
    const modLanguages = this.model.get('moderatorInfo')
      .get('languages')
      .map(lang => {
        const langData = getLangByCode(lang);
        return langData && langData.name || lang;
      });

    loadTemplate('modals/moderatorDetails.html', (t) => {
      this.$el.html(t({
        followedByYou: this.followedByYou,
        displayCurrency: app.settings.get('localCurrency'),
        ownMod: app.settings.get('storeModerators').indexOf(this.model.id) !== -1,
        purchase: this.options.purchase,
        cardState: this.options.cardState,
        modLanguages,
        verifiedMod: this.verifiedModModel,
        ...this.model.toJSON(),
      }));
      super.render();

      this.$followBtn = this.$('.js-follow');
      this.$unFollowBtn = this.$('.js-unFollow');

      if (this.socialBtns) this.socialBtns.remove();
      // Don't include the social buttons if this is the viewer's own moderator details
      if (this.model.get('peerID') !== app.profile.id) {
        this.socialBtns = this.createChild(SocialBtns, {
          targetID: this.model.id,
          initialState: {
            stripClasses: 'flexHCent gutterH',
            btnClasses: 'clrP clrBr clrSh2',
          },
        });
        this.$('.js-socialBtns').append(this.socialBtns.render().$el);
      }

      if (this.verifiedMod) this.verifiedMod.remove();
      this.verifiedMod = this.createChild(VerifiedMod, getModeratorOptions({
        model: this.verifiedModModel,
        shortText: false,
      }));
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);

      if (this.supportedCurrenciesList) this.supportedCurrenciesList.remove();
      this.supportedCurrenciesList = this.createChild(SupportedCurrenciesList, {
        initialState: {
          currencies: this.model.get('moderatorInfo')
            .get('acceptedCurrencies'),
        },
      });
      this.getCachedEl('.js-supportedCurrenciesList')
        .append(this.supportedCurrenciesList.render().el);
    });

    return this;
  }
}

