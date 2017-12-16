import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import RatingsStrip from '../RatingsStrip';
import moment from 'moment';
import 'trunk8';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.ratingStrips = {};
  }

  className() {
    return 'review clrBr';
  }

  events() {
    return {
      'click .js-showMore': 'clickShowMore',
      'click .js-showLess': 'clickShowLess',
    };
  }

  clickShowMore(e) {
    // the show more button is added by the parent view when it applies trunk8 to the text
    const btnTxt = app.polyglot.t('listingDetail.review.showLess');
    $(e.target).parent().trunk8('revert')
      .append(`&nbsp; <button class="btnTxtOnly trunkLink js-showLess">${btnTxt}</button>`);
  }

  clickShowLess(e) {
    $(e.target).parent().trunk8();
  }

  render() {
    loadTemplate('reviews/review.html', (t) => {
      this.$el.html(t({
        moment,
        showListingData: this.options.showListingData,
        ...this.model.toJSON(),
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
            curRating: this.model.get(type) || 0,
          },
        });

        $el.append(this.ratingStrips[type].render().el);
      });
    });

    return this;
  }
}

