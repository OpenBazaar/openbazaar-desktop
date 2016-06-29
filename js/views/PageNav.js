import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';

export default class PageNavView extends View {
  constructor(options) {
    super({
      ...options,
      className: 'page-nav',
    });
  }

  render() {
    loadTemplate('pageNav.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
