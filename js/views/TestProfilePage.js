import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  events() {
    return {
    };
  }

  render() {
    loadTemplate('testProfile.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
