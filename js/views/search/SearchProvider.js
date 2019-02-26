import loadTemplate from '../../utils/loadTemplate';
import BaseView from '../baseVw';
import ProviderMd from '../../models/search/SearchProvider';
import { recordEvent } from '../../utils/metrics';

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
    recordEvent('Discover_ChangeProvider', {
      name: this.model.get('name') || 'unknown',
      url: this.model.get('listings'),
    });
  }

  render() {
    super.render();
    loadTemplate('search/provider.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this.options,
      }));
      if (this.options.active) this.$el.addClass('active');
    });
    return this;
  }
}
