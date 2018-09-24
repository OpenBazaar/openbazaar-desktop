import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);

    this.averageRating = options.averageRating || 0;
    this.ratingCount = options.ratingCount || 0;
    this.fetched = options.fetched || false;
  }

  className() {
    return 'ratingStrip';
  }

  render() {
    loadTemplate('modals/listingDetail/rating.html', t => {
      this.$el.html(t({
        averageRating: this.averageRating,
        ratingCount: this.ratingCount,
        fetched: this.fetched,
      }));

      super.render();
    });

    return this;
  }
}
