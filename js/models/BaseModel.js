import _ from 'underscore';
import { removeProp } from '../utils/object';
import { Model, Collection } from 'backbone';

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

    // take a snapshot of the attrs provided to this method
    const setAttrs = JSON.parse(JSON.stringify(attrs));

    const previousAttrs = this.toJSON();

    // todo: will it break things if we unset a nested attribute?
    if (!opts.unset) {
      // let's work off of a clone since we modify attrs
      // attrs = JSON.parse(JSON.stringify(attrs));

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
    if (!_.isEqual(this.toJSON(), previousAttrs)) {
      this.trigger('someChange', this, { setAttrs });
    }

    return superSet;
  }

  mergeInNestedModelErrors(errObj = {}) {
    const nested = _.result(this, 'nested', []);
    const prefixedErrs = {};

    Object.keys(nested || {})
      .forEach((key) => {
        if (this.get(key) instanceof Model) {
          const nestedMd = this.get(key);
          const nestedErrs = nestedMd.isValid() ? {} : nestedMd.validationError;

          Object.keys(nestedErrs).forEach((nestedErrKey) => {
            const prefixedKey = `${key}.${nestedErrKey}`;
            prefixedErrs[prefixedKey] = errObj[prefixedKey] || [];
            prefixedErrs[prefixedKey].push(nestedErrs[nestedErrKey]);
          });
        }
      });

    return {
      ...errObj,
      ...prefixedErrs,
    };
  }

  mergeInNestedCollectionErrors(errObj = {}) {
    const nested = _.result(this, 'nested', []);
    let mergedErrs = errObj;

    Object.keys(nested || {})
      .forEach((key) => {
        if (this.get(key) instanceof Collection) {
          const nestedCl = this.get(key);

          nestedCl.forEach((nestedMd) => {
            const prefixedErrs = {};
            const nestedMdErrs = nestedMd.isValid() ? {} : nestedMd.validationError;

            Object.keys(nestedMdErrs).forEach((nestedMdErrKey) => {
              // since indexes can change, we'll index using the model's client id (cid)
              const prefixedKey = `${key}[${nestedMd.cid}].${nestedMdErrKey}`;
              prefixedErrs[prefixedKey] = errObj[prefixedKey] || [];
              prefixedErrs[prefixedKey].push(nestedMdErrs[nestedMdErrKey]);
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
    return {
      ...errObj,
      ...this.mergeInNestedModelErrors(errObj),
      ...this.mergeInNestedCollectionErrors(errObj),
    };
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
    }

    return super.sync(method, model, options);
  }
}
