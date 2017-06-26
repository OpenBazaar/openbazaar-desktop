import app from '../../../app';
import BaseModel from '../../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      review: '',
    };
  }

  get constraints() {
    return {
      minRatingValue: 1,
      maxRatingValue: 5,
      maxReviewCharacters: 3000,
    };
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const constraints = this.constraints;

    if (typeof attrs.anonymous !== 'boolean') {
      addError('anonymous', 'anonymous must be a boolean.');
    }

    if (typeof attrs.review !== 'string') {
      addError('review', 'A review must be provided as a string.');
    } else if (!attrs.review) {
      addError('review', app.polyglot.t('orderCompletionModelErrors.provideReview'));
    } else if (attrs.review.length > constraints.maxReviewCharacters) {
      addError('review',
        `The review exceeds the maximum length of ${constraints.maxReviewCharacters} characters.`);
    }

    const ratingFields = [
      'overall',
      'quality',
      'description',
      'deliverySpeed',
      'customerService',
    ];

    ratingFields.forEach(ratingField => {
      if (typeof attrs[ratingField] === 'undefined') {
        addError(ratingField,
          app.polyglot.t('orderCompletionModelErrors.provideRating'));
      } else if (typeof attrs[ratingField] !== 'number') {
        addError(ratingField,
          `${ratingField} must be provided as a number.`);
      } else if (attrs[ratingField] < constraints.minRatingValue ||
        attrs[ratingField] > constraints.maxRatingValue) {
        addError(ratingField,
          `${ratingField} must be a number between ${constraints.minRatingValue} ` +
            `and ${constraints.maxRatingValue}.`);
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
