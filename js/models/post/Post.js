import _ from 'underscore';
import is from 'is_js';
import app from '../../app';
import { getServerCurrency } from '../../data/cryptoCurrencies';
import { getIndexedCountries } from '../../data/countries';
import { events as postEvents } from './';
import { decimalToInteger, integerToDecimal } from '../../utils/currency';
import { defaultQuantityBaseUnit } from '../../data/cryptoListingCurrencies';
import PostBody from './PostBody';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.guid = options.guid;
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  defaults() {
    return {
      postBody: new PostBody(),
    };
  }

  isNew() {
    return !this.get('slug');
  }

  get nested() {
    return {
      postBody: PostBody
    };
  }

  get max() {
    return {
      // refundPolicyLength: 10000,
      // termsAndConditionsLength: 10000,
      // couponCount: 30,
    };
  }

  get isOwnPost() {
    if (this.guid === undefined) {
      throw new Error('Unable to determine ownPost ' +
        'because a guid has not been set on this model.');
    }

    return app.profile.id === this.guid;
  }

  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    errObj = this.mergeInNestedErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    let returnSync = 'will-set-later';

    if (method === 'read') {
      if (!this.guid) {
        throw new Error('In order to fetch a post, a guid must be set on the model instance.');
      }

      const slug = this.get('slug');

      if (!slug) {
        throw new Error('In order to fetch a post, a slug must be set as a model attribute.');
      }

      if (this.isOwnListing) {
        options.url = options.url ||
          app.getServerUrl(`ob/post/${slug}`);
      } else {
        options.url = options.url ||
          app.getServerUrl(`ob/post/${this.guid}/${slug}`);
      }
    } else {
      if (method !== 'delete') {
        options.url = options.url || app.getServerUrl('ob/post/');
        // it's a create or update
        options.attrs = options.attrs || this.toJSON();

        // remove the hash
        delete options.attrs.hash;

      } else {
        options.url = options.url ||
          app.getServerUrl(`ob/post/${this.get('slug')}`);
      }
    }

    returnSync = super.sync(method, model, options);

    const eventOpts = {
      xhr: returnSync,
      url: options.url,
    };

    if (method === 'create' || method === 'update') {
      const attrsBeforeSync = this.lastSyncedAttrs;

      returnSync.done(data => {
        const hasChanged = () => (!_.isEqual(attrsBeforeSync, this.toJSON()));

        if (data.slug) {
          this.set('slug', data.slug);
        }

        postEvents.trigger('saved', this, {
          ...eventOpts,
          created: method === 'create',
          slug: this.get('slug'),
          prev: attrsBeforeSync,
          hasChanged,
        });
      });
    } else if (method === 'delete') {
      postEvents.trigger('destroying', this, {
        ...eventOpts,
        slug: this.get('slug'),
      });

      returnSync.done(() => {
        postEvents.trigger('destroy', this, {
          ...eventOpts,
          slug: this.get('slug'),
        });
      });
    }

    return returnSync;
  }

  parse(response) {
    this.unparsedResponse = JSON.parse(JSON.stringify(response)); // deep clone
    const parsedResponse = response.post;

    if (parsedResponse) {

      // set the hash
      parsedResponse.hash = response.hash;


    }

    return parsedResponse;
  }
}
