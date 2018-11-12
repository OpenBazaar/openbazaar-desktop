import $ from 'jquery';
import moment from 'moment';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import RatingsStrip from '../../../RatingsStrip';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.dataObject) {
      throw new Error('Please provide a buyerOrderCompletion data object.');
    }

    this.dataObject = options.dataObject;
    this.ratingStrips = {};
  }

  className() {
    return 'orderCompleteEvent rowLg';
  }

  render() {
    const rating = this.dataObject.ratings[0].ratingData;
    loadTemplate('modals/orderDetail/summaryTab/orderComplete.html', (t) => {
      this.$el.html(t({
        ...rating,
        ...this._state,
        timestamp: this.dataObject.timestamp,
        moment,
      }));

      this.$('.ratingsContainer').each((index, element) => {
        const $el = $(element);
        const type = $el.data('ratingType');

        if (!type) {
          throw new Error('Unable to render the ratings strips because it\'s container does not ' +
            'specify a type.');
        }

        if (this.ratingStrips[type]) this.ratingStrips[type].remove();
        this.ratingStrips[type] = this.createChild(RatingsStrip, {
          initialState: {
            curRating: rating[type] || 0,
          },
        });

        $el.append(this.ratingStrips[type].render().el);
      });
    });

    return this;
  }
}
