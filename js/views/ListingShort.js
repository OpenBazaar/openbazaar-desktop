import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.listenTo(this.model, 'change', this.render);
  }

  className() {
    return 'col clrBr clrT';
  }

  events() {
    return {
      // 'click .js-edit': 'onClickEdit',
    };
  }

  render() {
    loadTemplate('listingShort.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
