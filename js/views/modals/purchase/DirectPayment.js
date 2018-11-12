import BaseView from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

export default class extends BaseView {
  constructor(options = {}) {
    const opts = {
      className: 'moderatorsWrapper fauxModeratorsWrapper',
      ...options,
      initialState: {
        active: false,
        ...options.initialState || {},
      },
    };

    super(opts);
  }

  events() {
    return {
      'click .js-directPayment': 'clickDirectPurchase',
    };
  }

  clickDirectPurchase() {
    this.setState({ active: true });
    this.trigger('click', { active: true });
  }

  render() {
    loadTemplate('modals/purchase/directPayment.html', t => {
      this.$el.html(t({
        ...this.getState(),
      }));

      super.render();
    });

    return this;
  }
}
