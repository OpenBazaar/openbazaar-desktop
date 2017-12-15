import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import VerifiedMod from '../../models/VerifiedMod';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model || !(options.model instanceof VerifiedMod)) {
      throw new Error('Please provide a valid VerifiedMod model.');
    }
    const opts = {
      arrowClass: '',
      ...options,
    };
    super(opts);
    this.options = opts;
  }

  className() {
    return 'verifiedMod';
  }

  events() {
    return {
      'click .js-badge': 'onClickBadge',
    };
  }

  render() {
    super.render();
    loadTemplate('/components/verifiedMod.html', (t) => {
      this.$el.html(t({
        ...this.options,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
