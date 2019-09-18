import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Model } from 'backbone';
import bigNumber from 'bignumber.js';
import { minValueByCoinDiv, isValidCoinDivisibility }
  from '../../js/utils/currency';

export function validateModelFieldDivisibilityRanges(
  ModelClass,
  modelField,
  itText,
  coinDiv,
  options = {}
) {
  let model;

  try {
    model = new ModelClass();
  } catch (e) {
    // pass
  }

  if (!model || !(model instanceof Model)) {
    throw new Error('Unable to construct a Model instance. Are you sure Model is a ' +
      'Backbone Model or descendant.');
  }

  if (typeof modelField !== 'string' || !modelField) {
    throw new Error('modelField must be provided as a non-empty string.');
  }

  const opts = {
    errKey: modelField,
    testStringNumber: true,
    // as in: typeof blah; // 'number'. FWIW, in general if the model field is tied
    // to a UI form field, it's best to only allow strings so numbers outside of JS's
    // ranges can be handled. You probably want a seperate validation and test to ensure
    // that.
    testNumber: false,
    ...options,
  };

  if (typeof opts.errKey !== 'string' || !opts.errKey) {
    throw new Error('The errKey option must be provided as a non-empty string.');
  }

  const { isValidCoinDiv, coinDivErr } = isValidCoinDivisibility(coinDiv);

  if (!isValidCoinDiv) {
    throw new Error(coinDivErr);
  }

  if (typeof itText !== 'string' || !itText) {
    throw new Error('itText must be provided as a non-empty string.');
  }

  if (
    typeof options.describeText !== 'undefined' &&
    (
      typeof options.describeText !== 'string' ||
      !options.describeText
    )
  ) {
    throw new Error('If providing describeText, it must be provided as a non-empty ' +
      'string.');
  }

  if (!opts.testStringNumber && !opts.testNumber) {
    throw new Error('One of opts.testStringNumber or opts.testNumber should be true, otherwise ' +
      'I have nothing to test here.');
  }

  const describeFn = options.describeText ?
    describe : (text, cb) => cb();
  describeFn(options.describeText, () => {
    it(itText, () => {
      const min = minValueByCoinDiv(coinDiv);

      if (opts.testNumber) {
        // Set to min - should not fail validation.
        model.set(
          { [modelField]: min },
          { validate: true }
        );

        let valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(false);

        // Set just below min - should fail validation.
        model.set(
          { [modelField]: Number(bigNumber(min).minus(bigNumber(0.00000001))) },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(true);

        // Set fraction digits right at max - should not fail.
        model.set(
          { [modelField]: Number(`0.${''.padEnd(coinDiv - 1, '0')}1`) },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(false);

        // Set fraction digits one more than the max - should fail.
        model.set(
          { [modelField]: Number(`0.${''.padEnd(coinDiv, '0')}1`) },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(true);
      }

      if (opts.testStringNumber) {
        // Set to min - should not fail validation.
        model.set(
          { [modelField]: String(min) },
          { validate: true }
        );

        let valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(false);

        // Set just below min - should fail validation.
        model.set(
          { [modelField]: bigNumber(min).minus(bigNumber(0.00000001)).toString() },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(true);

        // Set fraction digits right at max - should not fail.
        model.set(
          { [modelField]: `0.${''.padEnd(coinDiv - 1, '0')}1` },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(false);

        // Set fraction digits one more than the max - should fail.
        model.set(
          { [modelField]: `0.${''.padEnd(coinDiv, '0')}1` },
          { validate: true }
        );

        valErr = model.validationError;

        expect(valErr && valErr[opts.errKey] &&
            !!valErr[opts.errKey].length || false).to.equal(true);
      }
    });
  });
}
