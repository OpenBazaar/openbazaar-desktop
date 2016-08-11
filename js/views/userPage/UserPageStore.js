import loadTemplate from '../../utils/loadTemplate';
import { View } from 'backbone';
import app from '../../app';

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'userPageStore',
      events: {
      },
      ...options,
    });
  }

  render() {
    loadTemplate('userPage/userPageStore.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
      }));
    });

    return this;
  }
}
