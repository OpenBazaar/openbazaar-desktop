import _ from 'underscore';
import { Model } from 'backbone';

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
    nested() {
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

  === validating nested attributes ===

  It is recommended that you validate nested attributes in the parent:

  class ParentModel extends BaseModel {
    validate(attrs) {
      const errObj = {};
      const addError = (fieldName, error) => {
        errObj[fieldName] = errObj[fieldName] || [];
        errObj[fieldName].push(error);
      };

      const SMTPSettings = attrs.get('SMTPSettings');
      if (SMTPSettings.notifications === false) {
        addError('SMTPSettings.notifications', 'Now why would you turn off notifications?');
      }

      const addresses = attrs.get('Addresses');
      addresses.forEach((address, index) => {
        if (address.get('street') === '') {
          addError(`addresses[${index}].street`, 'Im gonna need a street son');
        }
      });

      if (Object.keys(errObj).length) return errObj;

      return undefined;
    }
  }

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
  constructor(attrs) {
    super(attrs);

    this.lastSyncedAttrs = {};

    this.on('sync', () => {
      this.lastSyncedAttrs = JSON.parse(JSON.stringify(this.toJSON()));
    });
  }

  set(key, val, options) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val;
    } else {
      (attrs = {})[key] = val;
    }

    if (this.nested) {
      const nested = _.result(this, 'nested', []);
      Object.keys(nested).forEach((nestedKey) => {
        const NestedClass = nested[nestedKey];
        const nestedData = attrs[nestedKey];
        const nestedInstance = this.attributes[nestedKey];

        if (nestedInstance) {
          if (nestedData) nestedInstance.set(nestedData);
          delete attrs[nestedKey];
        } else {
          attrs[nestedKey] = new NestedClass(nestedData);
        }
      });
    }

    return super.set(attrs, opts);
  }

  toJSON() {
    const attrs = super.toJSON();

    if (this.nested) {
      const nested = _.result(this, 'nested', []);
      Object.keys(nested).forEach((nestedKey) => {
        attrs[nestedKey] = attrs[nestedKey].toJSON ?
          attrs[nestedKey].toJSON.call(attrs[nestedKey]) : attrs[nestedKey];
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
      this.set(this.defaults || {});
    }
  }

  clone() {
    return new this.constructor(this.toJSON());
  }
}
