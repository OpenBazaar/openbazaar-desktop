import _ from 'underscore';
import $ from 'jquery';
import app from '../app';
import { deparam } from '../utils';
import Backbone, { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';

class Listings extends Collection {
  constructor(models = [], options = {}) {
    if (!options.guid) {
      throw new Error('Please provide a guid.');
    }

    const opts = {
      useInProgressFetch: true,
      ...options,
    };

    super(models, opts);
    this.options = opts;
    this.guid = options.guid;
  }

  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    return app.getServerUrl(`ob/listings/${this.guid}`);
  }

  /**
   * @param {object} [options={}]
   * @param {boolean} [options.useInProgressFetch] - If this is true and there is an
   *   in=progress fetch with the same query params, it will be used rather than a new
   *   fetch being kicked off.
   */
  fetch(options = {}) {
    const opts = {
      useInProgressFetch: this.options.useInProgressFetch,
      ...options,
    };

    const url = opts.url || _.result(this, 'url');
    let data = opts.data ?
      deparam(opts.data) : null;
    const splitUrl = url.split('?');
    const dataInUrl = splitUrl.length > 1 ? splitUrl[1] : '';

    // in case query params were provided directly in the url, as opposed to
    // options.data
    if (dataInUrl) {
      data = data ?
        { ...data, ...deparam(dataInUrl) } : deparam(dataInUrl);
    }

    // we want to expliciclty check for 'false' here because jQuery will
    // default to true if it's omitted.
    data = opts.cache === false ?
      { ...data, cache: false } : data;

    if (data) {
      const dataCopy = { ...data };
      data = {};
      // sort the object alphabetically by property - this is to ensure
      // www.foo.com?alpha=dog&zeta=hog & www.foo.com?zeta=hog&alpha=dog map
      // to the same request.
      Object.keys(dataCopy).sort()
        .forEach(key => (data[key] = dataCopy[key]));
    }

    let haveInProg = false;
    let xhr;
    let normalizedUrl;

    if (opts.useInProgressFetch) {
      normalizedUrl = `${url}${$.param(data || {})}`;
      xhr = Listings.inProgressFetches[normalizedUrl];

      if (xhr) {
        haveInProg = true;
        opts.xhr = xhr;
      }
    }

    xhr = super.fetch(opts);

    if (!haveInProg) {
      Listings.inProgressFetches[normalizedUrl] = xhr.always(() =>
        delete Listings.inProgressFetches[normalizedUrl]);
    }

    return xhr;
  }

  sync(method, model, options) {
    // This is less than ideal!
    // The default backbone.sync implemenation is repeated here because we need
    // to make one minor tweak to it in that if an xhr is passed in, it uses that
    // xhr rather than kicking off a new. The tweak is surrounded by
    // 'ALERT ALERT ALERT' comments.
    // bad news: if we ever update backbone and backbone.sync is updated, we'll
    // want to update this method as well
    // goodish news: in nearly 2 years, we've never had a need to update backbone

    // Disabling lint since this code comes exactly from the backbone source. Without
    // linting, it would make any potential updates easier.
    /* eslint-disable */
    var methodMap = {
      'create': 'POST',
      'update': 'PUT',
      'patch': 'PATCH',
      'delete': 'DELETE',
      'read': 'GET',
    };

    var type = methodMap[method];

    var urlError = function() {
      throw new Error('A "url" property or function must be specified');
    };

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // Make the request, allowing the user to override any Ajax options.

    // ALERT ALERT ALERT - the following line is the only change from source:
    var xhr = options.xhr || Backbone.ajax(_.extend(params, options));
    // ALERT ALERT ALERT

    model.trigger('request', model, xhr, options);
    return xhr;
    /* eslint-enable */
  }

  /**
   * Returns a list of the aggregate categories from all
   * the listing in the collection.
   */
  get categories() {
    const cats = [];

    this.models.forEach(listing => {
      listing.get('categories')
        .forEach(cat => {
          if (cats.indexOf(cat) === -1) cats.push(cat);
        });
    });

    // todo: For now sort will only be accurate for standard ascii
    // characters. In order to properly sort categories with
    // foreign characters, we will need to know what language
    // the listing is in and pass that into localeCompare().
    // https://github.com/OpenBazaar/openbazaar-go/issues/143
    return cats.sort();
  }
}

Listings.inProgressFetches = {};

export default Listings;
