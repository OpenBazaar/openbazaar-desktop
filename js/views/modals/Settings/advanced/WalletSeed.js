import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        seed: '',
        isFetching: false,
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.listenTo(this.model, 'change', () => this.render());
  }

  className() {
    return 'walletSeed gutterH';
  }

  events() {
    return {
      'click .js-showSeed': 'onClickShowSeed',
    };
  }

  onClickShowSeed() {
    this.trigger('clickShowSeed');
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/walletSeed.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
