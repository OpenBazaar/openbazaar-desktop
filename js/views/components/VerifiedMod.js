import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import VerifiedMod from '../../models/VerifiedMod';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      arrowClass: '',
      type: {},
      data: {},
      showText: false,
      ...options,
    };

    super(opts);
    this.options = opts;
    // if no model is passed in, show the non-verified state instead
    this.verified = options.model && options.model instanceof VerifiedMod;
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
        ...(this.model ? this.model : {}),
        verified: this.verified,
      }));
    });

    return this;
  }
}
