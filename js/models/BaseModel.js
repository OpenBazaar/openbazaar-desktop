import _ from 'underscore';
import { Model, Collection } from 'backbone';
import app from '../app';
import { removeProp } from '../utils/object';
import {
  validateCurrencyAmount,
  CUR_VAL_RANGE_TYPES,
} from '../utils/currency';

/*

  The Base Model manages nested attributes by creating Model or Collection instances
  for them as defined in the nested attribute (which the developer is to declare).

  (Please note: this is intented for models that interface with APIs that return nested
   atttributes, i.e. for a model that interfaces with a single API)

  First off, you want to declare your nested members by implementing a 'nested' function
  that returns an object of key value pairs. The key represents the key of the nested
  attribute as it is returned by the API. The value represents the Model or Collection that is
  to be created to manage the corresponding attributes.

  For example:

  import { Model, Collection } from 'backbone';
  import CustomModel from './models';
  import CustomCollection from './collections';

  class ParentModel extends BaseModel {
    get nested() {
      return {
        SMTPSettings: Model,
        serverConfig: CustomModel,
        addresses: Collection,
        listings: CustomCollection,
      }
    }
  }

  The main reason you would want to provide a custom Model / Collection is if you want to
  declare defaults for the nested attributes.

  === setting nested attributes ===

  You have multiple options:

  // can be done during the parent creation
  const parentModel = new ParentModel({
    SMTPSettings: {
      notifications: false,
    }
  });

  // can be set via the parent
  parentModel.set({
    SMTPSettings: {
      notifications: false,
    }
  });

  // can be set directly on the nested model / collection (see note)
  parentModel.get('SMTPSettings').set('notifications', false);

  Please Note: For a nested collection, unless the models have IDs, it's
  recommended that you directly update the models on the nested collection,
  at least if you want the relevant events to fire properly.

  === saving nested attributes ===

  This is something you want to do via the parent:

  parentModel.save();

  parentModel.save({
    SMTPSettings: {
      notifications: false,
    }
  });

  === events ===

  Events related to the nested attributes need to be directly bound to the nested
  model / collection (e,g. if a nested model changes, the parent's change event
  will -not- fire):

  this.listenTo(parentModel.get('SMTPSettings'), 'change', () => {});
  this.listenTo(parentModel.get('SMTPSettings'), 'change:notifications', () => {});
  this.listenTo(parentModel.get('addresses'), 'update', () => {});
  this.listenTo(parentModel.get('addresses'), 'add remove', () => {});
  this.listenTo(parentModel.get('addresses'), 'change:street', () => {});
*/

export default class extends Model {
  constructor(...args) {
    super(...args);

    this.lastSyncedAttrs = {};

    this.on('sync', () => {
      this.lastSyncedAttrs = JSON.parse(JSON.stringify(this.toJSON()));
    });
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    // take a snapshot of the attrs before updating so we can compare later
    // to see if anything changed
    const previousAttrs = JSON.parse(JSON.stringify(this.toJSON()));

    // todo: will it break things if we unset a nested attribute?
    if (!opts.unset) {
      if (this.nested) {
        const nested = _.result(this, 'nested', []);

        Object.keys(nested).forEach((nestedKey) => {
          const NestedClass = nested[nestedKey];
          const nestedData = attrs[nestedKey];
          const nestedInstance = this.attributes[nestedKey];

          if (nestedData) {
            // let's work off of a copy since we modify attrs
            attrs = { ...attrs };

            if (nestedData instanceof NestedClass) {
              attrs[nestedKey] = nestedData;
            } else if (nestedInstance) {
              if (nestedInstance instanceof Model) {
                nestedInstance.set(nestedInstance.parse(nestedData));
              } else {
                nestedInstance.set(nestedData, { parse: true });
              }

              delete attrs[nestedKey];
            } else {
              attrs[nestedKey] = new NestedClass(nestedData, { parse: true });
            }
          }
        });
      }
    }

    const superSet = super.set(attrs, opts);

    // Since the standard change event doesn't properly take into
    // account nested models, we'll fire our own event if any part of the
    // model (including nested parts) change.
    if (!_.isEqual(JSON.parse(JSON.stringify(this.toJSON())), previousAttrs)) {
      this.trigger('someChange', this, { setAttrs: attrs });
    }

    return superSet;
  }

  _mergeInNestedModelErrors(errObj = {}) {
    const nested = _.result(this, 'nested', []);
    const prefixedErrs = {};

    Object.keys(nested || {})
      .forEach((key) => {
        if (this.get(key) instanceof Model) {
          const nestedMd = this.get(key);
          const nestedErrs = !nestedMd.isValid() ? nestedMd.validationError : {};

          Object.keys(nestedErrs).forEach((nestedErrKey) => {
            const prefixedKey = `${key}.${nestedErrKey}`;
            prefixedErrs[prefixedKey] = errObj[prefixedKey] || [];
            prefixedErrs[prefixedKey] =
              prefixedErrs[prefixedKey].concat(nestedErrs[nestedErrKey]);
          });
        }
      });

    return {
      ...errObj,
      ...prefixedErrs,
    };
  }

  _mergeInNestedCollectionErrors(errObj = {}) {
    const nested = _.result(this, 'nested', []);
    let mergedErrs = errObj;

    Object.keys(nested || {})
      .forEach((key) => {
        if (this.get(key) instanceof Collection) {
          const nestedCl = this.get(key);

          nestedCl.forEach(nestedMd => {
            const prefixedErrs = {};
            const nestedMdErrs = !nestedMd.isValid() ? nestedMd.validationError : {};

            Object.keys(nestedMdErrs).forEach(nestedMdErrKey => {
              // since indexes can change, we'll index using the model's client id (cid)
              const prefixedKey = `${key}[${nestedMd.cid}].${nestedMdErrKey}`;
              prefixedErrs[prefixedKey] = errObj[prefixedKey] || [];
              prefixedErrs[prefixedKey] =
                prefixedErrs[prefixedKey].concat(nestedMdErrs[nestedMdErrKey]);
            });

            mergedErrs = {
              ...mergedErrs,
              ...prefixedErrs,
            };
          });
        }
      });

    return mergedErrs;
  }

  mergeInNestedErrors(errObj = {}) {
    // The _mergeInNested... functions need to be called before
    // _setNestedValidationErrors since the former clear the validation
    // errors and the latter adds on to the nested ones. If you called them
    // in reverse _mergeInNested... would overwrite the _setNestedValidationErrors.
    const merged = {
      ...errObj,
      ...this._mergeInNestedModelErrors(errObj),
      ...this._mergeInNestedCollectionErrors(errObj),
    };

    this._setNestedValidationErrors(merged);

    return merged;
  }

  /*
   * This will ensure that the validationError property is updated on all
   * nested instances with any errors based on the provided errObj. This will
   * only be called on the top-level parent of a model with nested elements.
   * It will go as many levels deep as described by the structure of the
   * keys in the provided errObj.
   */
  _setNestedValidationErrors(errObj = {}) {
    Object.keys(errObj)
      .forEach(errKey => {
        try {
          const split = errKey.split('.');

          let baseInstance = this;

          split
            .forEach((deepErrKey, deepIndex) => {
              if (deepErrKey.includes('[')) {
                const clientID = deepErrKey.match(/\[(.*?)\]/)[1];

                if (!clientID) {
                  throw new Error('Unable to obtain the client id.');
                } else {
                  baseInstance = baseInstance
                    .get(deepErrKey.slice(0, deepErrKey.indexOf('[')))
                    .get(clientID);
                }
              } else if (deepIndex + 1 === split.length) {
                if (!baseInstance) {
                  throw new Error('Unable to obtain the nested instance.');
                }

                baseInstance.validationError =
                  baseInstance.validationError || {};
                baseInstance.validationError[deepErrKey] = errObj[errKey];
              } else {
                baseInstance = baseInstance.nested[deepErrKey] ?
                  baseInstance.get(deepErrKey) : baseInstance;
              }
            });
        } catch (e) {
          throw e;
        }
      });

    return errObj;
  }

  toJSON() {
    const attrs = super.toJSON();

    if (this.nested) {
      const nested = _.result(this, 'nested', []);
      Object.keys(nested).forEach((nestedKey) => {
        if (attrs[nestedKey]) {
          attrs[nestedKey] = attrs[nestedKey].toJSON();
        }
      });
    }

    attrs.cid = this.cid;

    return attrs;
  }

  /**
   * Will reset the models attributes to the last synced ones or
   * the default ones.
   */
  reset() {
    if (Object.keys(this.lastSyncedAttrs).length) {
      this.set(JSON.parse(JSON.stringify(this.lastSyncedAttrs)));
    } else {
      this.clear();
      this.set(_.result(this, 'defaults', {}));
    }

    this.validationError = null;
  }

  clone() {
    const clone = new this.constructor(this.toJSON());

    clone.lastSyncedAttrs = this.lastSyncedAttrs;

    return clone;
  }

  sync(method, model, options) {
    if ((method === 'create' || method === 'update') && options.attrs) {
      options.attrs = removeProp(options.attrs, '_clientID');
      options.attrs = removeProp(options.attrs, 'cid');
    }

    return super.sync(method, model, options);
  }

  // todo: would be nice to add addError to the base model rather than each validate
  // implementation having to repeat it. Would also be nice if it kept track of it's own
  // error object. Would probably need some type of clearError functionality. It would
  // also save us from having to pass in addError here.
  /*
   * Will validate that the provided currency definition is valid. If it's not valid
   * it will add appropriate errors via the provided addErr function. This method uses
   * validateCurrencyAmount from the currency module to validate the given currency
   * definition.
   * @param {object} curDef - a currency definition object
   * @param {object} curDef.currency - a currency object
   * @param {string} curDef.currency.code - a string currency code, e.g 'BTC'
   * @param {number} curDef.currency.divisibility - An integer representing the
   *  the currency's divisibility.
   * @param {object} curDef.amount - The amount of the currency. This should
   *   likely be a BigNumber instance, but can also be a number or a string-based
   *   number depending on the requireBigNumAmount option that defaults to true
   *   in the currency module validateCurrencyAmount function.
   * @param {function} addError - A function that takes the errKey and error string and
   *   adds it to the model's errObj. This function is duplicated by most models in
   *   their validate method. (there is a TODO to centralize this somewhere rather
   *   than each validate having to duplicate it)
   * @param {string} errKey - The error key corresponding to the field being validated.
   *   This will be passed into the above addError function in the case of an error
   *   being found.
   * @param {object} options
   * @param {object} options.translations - An object mapping error types to the
   *   transalation keys that should be used when adding the error strings via addErr.
   *   The translations have defaults, so only override if you need a specific error
   *   message for a particular error or errors. Pass in false if you don't want a
   *   particular error added to the error object.
   * @param {object} options.validationOptions - These options will be passed in as the
   *   options to be used for validateCurrencyAmount from the currency module.
   * @returns {object} - The return value of validateCurrencyAmount from the currency
   *   module will be returned.
   */
  validateCurrencyAmount(
    curDef,
    addError,
    errKey,
    options = {}
  ) {
    if (typeof errKey !== 'string' || !errKey) {
      throw new Error('The errKey must be provided as a non-empty string.');
    }

    if (typeof addError !== 'function') {
      throw new Error('addError must be provided as a function.');
    }

    const opts = {
      ...options,
      translations: {
        coinDiv: 'currencyAmountErrors.invalidCoinDiv',
        required: 'currencyAmountErrors.missingValue',
        type: 'currencyAmountErrors.invalidType',
        fractionDigitCount: 'currencyAmountErrors.fractionTooLow',
        ...options.translations,
      },
    };

    // This should match the default range in validateCurrencyAmount()
    const defaultRange = CUR_VAL_RANGE_TYPES.GREATER_THAN_ZERO;

    if (!opts.translations.range) {
      const range =
        options.validationOptions &&
        options.validationOptions.rangeType ||
        defaultRange;

      if (range === CUR_VAL_RANGE_TYPES.GREATER_THAN_ZERO) {
        opts.translations.range = 'currencyAmountErrors.greaterThanZero';
      } else if (range === CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO) {
        opts.translations.range = 'currencyAmountErrors.greaterThanEqualZero';
      }
    }

    let divisibility;
    let currency;

    try {
      divisibility = _.result(curDef.currency, 'divisibility');
      currency = _.result(curDef.currency, 'code');
    } catch (e) {
      // pass
    }

    const validation = validateCurrencyAmount(
      curDef.amount,
      divisibility,
      opts.validationOptions
    );

    if (
      validation.validCoinDiv === false &&
      typeof opts.translations.coinDiv === 'string'
    ) {
      // almost certainly developer error
      addError(errKey, app.polyglot.t(opts.translations.coinDiv));
      return validation;
    }

    if (
      validation.validRequired === false &&
      typeof opts.translations.required === 'string'
    ) {
      addError(errKey, app.polyglot.t(opts.translations.required));
      return validation;
    }

    if (
      validation.validType === false &&
      typeof opts.translations.type === 'string'
    ) {
      addError(errKey, app.polyglot.t(opts.translations.type));
      return validation;
    }

    if (
      validation.validRange === false &&
      typeof opts.translations.range === 'string'
    ) {
      addError(errKey, app.polyglot.t(opts.translations.range));
    } else {
      if (
        validation.validFractionDigitCount === false &&
        typeof opts.translations.fractionDigitCount === 'string'
      ) {
        addError(errKey, app.polyglot.t(opts.translations.fractionDigitCount, {
          cur: currency,
          coinDiv: divisibility,
        }));
      }
    }

    return validation;
  }
}

/*
 * This works similar to Model.toJSON in that it will replace nested
 * Models and Collection instances with objects containing their respective
 * attributes. The difference of this function is you could pass in the
 * attributes you want to flatten as opposed to toJSON which just works
 * off of Model.attributes.
 *
 * One use-case is where Model.validate is given attributes that potentially
 * contain nested model and collection instances. If you want to flatten that
 * structure, it can be done via this method.
 */
export function flattenAttrs(attrs = {}) {
  const result = {};

  Object
    .keys(attrs)
    .forEach(attrKey => {
      if (attrs[attrKey] instanceof Model) {
        result[attrKey] = flattenAttrs({
          ...attrs[attrKey].attributes,
          cid: attrs[attrKey].cid,
        });
        result[attrKey].cid = attrs[attrKey].cid;
      } else if (attrs[attrKey] instanceof Collection) {
        result[attrKey] =
          attrs[attrKey].models.map(
            mod => flattenAttrs({
              ...mod.attributes,
              cid: mod.cid,
            })
          );
      } else {
        result[attrKey] = attrs[attrKey];
      }
    });

  return result;
}
