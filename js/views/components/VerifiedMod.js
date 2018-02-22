import BaseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';
import VerifiedMod from '../../models/VerifiedMod';
import app from '../../app';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      arrowClass: '',
      type: {},
      data: {},
      ...options,
    };

    super(opts);
    this.options = opts;
    // If no model is passed in, show the non-verified state instead
    // For listings, this model might be just the first verified moderator on the listing.
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
        ...(this.model ? this.model.toJSON() : {}),
        data: app.verifiedMods.data,
        verified: this.verified,
      }));
    });

    return this;
  }
}
