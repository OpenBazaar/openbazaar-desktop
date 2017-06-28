import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);

    this.averageRating = '';
    this.ratingCount = '';
  }

  render() {
    loadTemplate('modals/listingDetail/rating.html', t => {
      this.$el.html(t({
        averageRating: this.averageRating,
        ratingCount: this.ratingCount,
      }));

      super.render();
    });

    return this;
  }
}
