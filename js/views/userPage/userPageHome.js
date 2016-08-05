import loadTemplate from '../../utils/loadTemplate';
import { View } from 'backbone';
import app from '../../app';

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'userPageHome',
      events: {
      },
      ...options,
    });
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
    });

    return this;
  }
}

