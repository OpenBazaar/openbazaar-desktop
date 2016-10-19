import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import { clipboard } from 'electron';
import BaseVw from '../baseVw';

export default class extends BaseVw {
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
      'click .js-guid': 'guidClick',
      'mouseleave .js-guid': 'guidLeave',
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
      // do the following as the callback of the remove moderator action
      this.currentModerator = false;
      this.$addModeratorLbl.removeClass('hide');
      this.$removeModeratorLbl.addClass('hide');
    } else {
      // do the following as the callback of the add moderator action
      this.currentModerator = true;
      this.$addModeratorLbl.addClass('hide');
      this.$removeModeratorLbl.removeClass('hide');
    }
  }

  guidClick(e) {
    const guid = $(e.target).data('guid');
    clipboard.writeText(guid);
    this.$('.js-guidCopied').fadeIn(600);
  }

  guidLeave() {
    this.$('.js-guidCopied').fadeOut(600);
  }

  render() {
    loadTemplate('userPage/userPageHome.html', (t) => {
      loadTemplate('userShort.html', (u) => {
        this.$el.html(
          t({
            currentModerator: this.currentModerator,
            userShortTmp: u,
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

