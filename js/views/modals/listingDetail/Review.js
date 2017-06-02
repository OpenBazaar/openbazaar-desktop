import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'review';
  }

  render() {
    loadTemplate('modals/listingDetail/review.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}

