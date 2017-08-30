import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import ProviderMd from '../../models/search/SearchProvider';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model || !(options.model instanceof ProviderMd)) {
      throw new Error('Please provide a model.');
    }

    super(options);
    this.options = options;
  }

  className() {
    return 'searchProvider flexVCent clrBrT';
  }

  events() {
    return {
      'click .js-provider': 'onClickProvider',
    };
  }

  onClickProvider() {
    this.trigger('click', this.model);
  }

  render() {
    super.render();
    loadTemplate('search/Provider.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
      if (this.options.active) this.$el.addClass('active');
      if (!this.model.get(this.options.urlType)) this.$el.addClass('hide');
    });
    return this;
  }
}
