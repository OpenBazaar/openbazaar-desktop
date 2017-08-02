import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);
  }

  className() {
    return 'searchProvider';
  }

  events() {
    return {
      'click .js-deleteProvider': 'onClickRemove',
    };
  }

  onClickRemove() {
    this.trigger('remove-click', { view: this });
  }

  render() {
    super.render();
    loadTemplate('search/Provider.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
      }));
    });
    return this;
  }
}
