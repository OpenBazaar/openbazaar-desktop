import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Profile from '../../models/profile/Profile';
import SocialBtns from '../components/SocialBtns';
import BaseModal from './BaseModal';
import { getLangByCode } from '../../data/languages';
import VerifiedMod from '../components/VerifiedMod';

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
      const nowIsVerifiedMod = app.verifiedMods.get(this.model.get('peerID'));
      if (nowIsVerifiedMod !== this.verifiedModModel) {
        this.verifiedModModel = nowIsVerifiedMod;
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
      this.socialBtns = this.createChild(SocialBtns, {
        targetID: this.model.id,
        initialState: {
          stripClasses: 'flexHCent gutterH',
          btnClasses: 'clrP clrBr clrSh2',
        },
      });
      this.$('.js-socialBtns').append(this.socialBtns.render().$el);

      if (this.verifiedMod) this.verifiedMod.remove();
      this.verifiedMod = this.createChild(VerifiedMod, {
        model: this.verifiedModModel,
        data: app.verifiedMods.data,
        showLongText: true,
      });
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
    });

    return this;
  }
}

