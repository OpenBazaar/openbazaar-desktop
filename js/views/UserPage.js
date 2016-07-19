import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    if (!options.model) {
      throw new Error('Please provide a Profile model');
    }

    this.options = options;
  }

  render() {
    loadTemplate('userPage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        tab: this.options.tab || '',
        category: this.options.category || '',
        layer: this.options.layer || '',
      }));
    });

    return this;
  }
}
