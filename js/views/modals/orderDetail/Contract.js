import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.options = opts || {};
  }

  className() {
    return 'contractTab';
  }

  events() {
    return {
      'click .js-backToSummary': 'onClickBackToSummary',
      'click .renderjson a': 'onClickRenderjsonLink',
    };
  }

  onClickBackToSummary() {
    this.trigger('clickBackToSummary');
  }

  onClickRenderjsonLink() {
    return false;
  }

  render() {
    loadTemplate('modals/orderDetail/contract.html', t => {
      this.$el.html(t());
      const renderjsonHtml =
        window.renderjson.set_show_to_level(1)(this.model.get('unparsedContract'));
      this.$('.js-contractContainer').append(renderjsonHtml);
    });

    return this;
  }
}
