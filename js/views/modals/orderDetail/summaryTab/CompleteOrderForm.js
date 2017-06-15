import $ from 'jquery';
import {
  completeOrder,
  completingOrder,
  events as orderEvents,
} from '../../../../utils/order';
import loadTemplate from '../../../../utils/loadTemplate';
import Rating from '../../../../models/order/orderCompletion/Rating';
import BaseVw from '../../../baseVw';
import RatingsStrip from '../../../RatingsStrip';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!options.model) {
      throw new Error('Please provide an OrderCompletion model.');
    }

    this.ratingStrips = {};

    const ratings = this.model.get('ratings');

    if (ratings.length) {
      this.rating = ratings.at(0);
    } else {
      this.rating = new Rating();
      ratings.push(this.rating);
    }

    this.listenTo(orderEvents, 'completingOrder', () => {
      this.getCachedElement('.js-completeOrder').addClass('processing');
    });

    this.listenTo(orderEvents, 'completeOrderComplete completeOrderFail', () => {
      this.getCachedElement('.js-completeOrder').removeClass('processing');
    });

    console.log('hippo');
    window.hippo = this.model;
  }

  className() {
    return 'completeOrderForm rowLg';
  }

  events() {
    return {
      'click .js-completeOrder': 'onClickCompleteOrder',
    };
  }

  // get $trackingCopiedToClipboard() {
  //   return this._$copiedToClipboard ||
  //     (this._$copiedToClipboard = this.$('.js-trackingCopiedToClipboard'));
  // }


  onClickCompleteOrder() {
    const data = {
      ...this.getFormData(),
      // If a rating is not set, the RatingStrip view will return 0. We'll
      // send undefined in that case since it gives us a more
      overall: this.ratingStrips.overall.rating || undefined,
      quality: this.ratingStrips.quality.rating || undefined,
      description: this.ratingStrips.description.rating || undefined,
      deliverySpeed: this.ratingStrips.deliverySpeed.rating || undefined,
      customerService: this.ratingStrips.customerService.rating || undefined,
    };

    this.rating.set(data);
    this.rating.set(data, { validate: true });

    if (!this.rating.validationError) {
      completeOrder(this.model.id, this.model.toJSON());
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/completeOrderForm.html', (t) => {
      this.$el.html(t({
        ...this.rating.toJSON(),
        errors: this.rating.validationError || {},
        isCompleting: !!completingOrder(this.model.id),
      }));

      // this._$copiedToClipboard = null;

      this.$('.ratingsContainer').each((index, element) => {
        const $el = $(element);
        const type = $el.data('ratingType');

        if (!type) {
          throw new Error('Unable to render a ratings strips because it\'s container does not ' +
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
