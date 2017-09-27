import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import Profile from '../../models/profile/Profile';
import SocialBtns from '../SocialBtns';
import BaseModal from './BaseModal';

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
    loadTemplate('modals/moderatorDetails.html', (t) => {
      this.$el.html(t({
        followedByYou: this.followedByYou,
        displayCurrency: app.settings.get('localCurrency'),
        ownMod: app.settings.get('storeModerators').indexOf(this.model.id) !== -1,
        purchase: this.options.purchase,
        cardState: this.options.cardState,
        ...this.model.toJSON(),
      }));
      super.render();

      this.$followBtn = this.$('.js-follow');
      this.$unFollowBtn = this.$('.js-unFollow');

      if (this.socialBtns) this.socialBtns.remove();
      this.socialBtns = this.createChild(SocialBtns, {
        targetID: this.model.id,
        stripClasses: 'flexHCent gutterH',
        btnClasses: 'clrP clrBr clrSh2',
      });
      this.$('.js-socialBtns').append(this.socialBtns.render().$el);
    });

    return this;
  }
}

