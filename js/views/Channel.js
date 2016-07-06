import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';

export default class Channel extends View {
  constructor(options = {}) {
    super(options);
    if (!options.model) {
      throw new Error('Please provide a Profile model');
    }

    this.options = options;
  }

  render() {
    loadTemplate('channel.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        category: this.options.category || '',
        layer: this.options.layer || '',
      }));
    });

    return this;
  }
}
