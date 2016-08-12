import loadTemplate from '../../utils/loadTemplate';
import { View } from 'backbone';
import app from '../../app';

export default class extends View {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.ownPage = options.ownPage;
    this.currentModerator = false; // TODO set if this user is one of the viewer's moderators
  }

  className() {
    return 'userPageHome';
  }

  events() {
    return {
      'click .js-termsLink': 'termsClick',
      'click .js-termsClose': 'termsClose',
      'click .js-addModerator': 'addModeratorClick',
    };
  }

  termsClick() {
    this.$termsDisplay.toggleClass('open');
    if (this.$termsDisplay.hasClass('open')) this.$termsDisplay[0].scrollIntoViewIfNeeded();
  }

  termsClose() {
    this.$termsDisplay.removeClass('open');
  }

  addModeratorClick() {
    if (this.currentModerator) {
      console.log('remove moderator');
      // do the following as the callback of the remove moderator action
      this.currentModerator = false;
      this.$addModeratorLbl.removeClass('hide');
      this.$removeModeratorLbl.addClass('hide');
    } else {
      console.log('add moderator');
      // do the following as the callback of the add moderator action
      this.currentModerator = true;
      this.$addModeratorLbl.addClass('hide');
      this.$removeModeratorLbl.removeClass('hide');
    }
  }

  render() {
    loadTemplate('userPage/userPageHome.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
        currentModerator: this.currentModerator,
      }));

      this.userShort = this.$('.js-userShort');

      // add the userShort sub-template
      loadTemplate('userShort.html', (u) => {
        this.userShort.html(u({
          ...this.model.toJSON(),
        }));
      });

      this.$termsDisplay = this.$('.js-termsDisplay');
      this.$addModeratorLbl = this.$('.js-addModeratorLbl');
      this.$removeModeratorLbl = this.$('.js-removeModeratorLbl');
    });

    return this;
  }
}

