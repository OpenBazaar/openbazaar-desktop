import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      className: 'chatApp',
      ...options,
    });

    this.options = options;
  }

  render() {
    loadTemplate('chat.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
