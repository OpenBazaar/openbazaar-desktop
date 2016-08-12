import loadTemplate from '../../utils/loadTemplate';
import { View } from 'backbone';

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'userPageFollow',
      events: {
      },
      ...options,
    });
  }

  render() {
    loadTemplate('userPage/userPageFollow.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
