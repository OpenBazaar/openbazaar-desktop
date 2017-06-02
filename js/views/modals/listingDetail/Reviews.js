import $ from 'jquery';
import _ from 'underscore';
import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import app from '../../../app';
import Collection from '../../../collections/listing/Reviews';
import ReviewMd from '../../../models/listing/Review';
import Review from './Review';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!options.ratings || !options.ratings.length) {
      throw new Error('Please provide a list of rating hashes.');
    }

    this.startIndex = options.startIndex || 0;
    this.pageSize = options.pageSize || 3;
    this.options.async = this.options.async || false;
    this.options.async = false;
    this.collection = new Collection();
    this.listenTo(this.collection, 'add', model => this.addReview(model));
  }

  className() {
    return 'ratings';
  }

  events() {
    return {
    };
  }

  loadReviews(start = this.startIndex, pageSize = this.pageSize, async = this.options.async) {
    const reviewsData = {
      ids: this.options.ratings.slice(start, start + pageSize),
      async,
    };

    $.ajax({
      url: app.getServerUrl('ob/fetchratings'),
      data: JSON.stringify(reviewsData),
      dataType: 'json',
      contentType: 'application/json',
      type: 'POST',
    })
      .done(data => {
        this.startIndex = start + pageSize;
        console.log(data);
        console.log(async)
        if (!async) {
          console.log(_.pluck(data, 'ratingData'))
          this.collection.add(_.pluck(data, 'ratingData'));
        }
        console.log(this.collection)
      })
      .fail((xhr) => {
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      });
  }

  addReview(model) {
    console.log("add")
    if (!model || !model instanceof ReviewMd) {
      throw new Error('Please provide a valid Review model.');
    }

    const newReview = new Review({ model });
    this.$reviewWrapper.append(newReview.render().$el);
  }

  get $error() {
    return this._$error ||
      (this._$error = this.$('.js-error'));
  }

  get $reviewWrapper() {
    return this._$reviewWrapper ||
      (this._$reviewWrapper = this.$('.js-reviewWrapper'));
  }

  render() {
    loadTemplate('modals/listingDetail/reviews.html', (t) => {
      this.$el.html(t({

      }));

      this._$error = null;
      this._$reviewWrapper = null;
      this.loadReviews();
    });

    return this;
  }
}
