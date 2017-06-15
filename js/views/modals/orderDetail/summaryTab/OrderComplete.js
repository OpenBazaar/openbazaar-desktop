import $ from 'jquery';
import _ from 'underscore';
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

    // this._state = {
    //   buyerName: 'PHYSICAL_GOOD',
    //   showPassword: false,
    //   ...options.initialState || {},
    // };

    this.dataObject = options.dataObject;
    this.ratingStrips = {};
  }

  className() {
    return 'orderCompleteEvent rowLg';
  }

  // events() {
  //   return {
  //     'click .js-copyTrackingNumber': 'onClickCopyTrackingNumber',
  //   };
  // }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    console.log('moo');
    window.moo = this;
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
