import loadTemplate from '../utils/loadTemplate';
import BaseVw from './baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialTab: 'all',
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  get tagName() {
    return 'section';
  }

  className() {
    return 'notifications clrBr border clrP clrSh1';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
    };
  }

  // remove() {
  //   super.remove();
  // }

  render() {
    super.render();

    loadTemplate('notifications.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}
