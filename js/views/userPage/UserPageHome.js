import loadTemplate from '../../utils/loadTemplate';
import { View } from 'backbone';
import app from '../../app';

export default class extends View {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  className() {
    return 'userPageHome';
  }

  events() {
    return {
      'click .js-termsLink': 'termsClick',
      'click .js-termsClose': 'termsClose',
    };
  }

  termsClick() {
    this.$termsDisplay.toggleClass('open');
    if (this.$termsDisplay.hasClass('open')) this.$termsDisplay[0].scrollIntoViewIfNeeded();
  }

  termsClose() {
    this.$termsDisplay.removeClass('open');
  }

  render() {
    loadTemplate('userPage/userPageHome.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
      }));
      this.userShort = this.$('.js-userShort');
      // add the userShort sub-template
      loadTemplate('userShort.html', (u) => {
        this.userShort.html(u({
          ...app.profile.toJSON(),
        }));
      });

      this.$termsDisplay = this.$('.js-termsDisplay');
    });

    return this;
  }
}

