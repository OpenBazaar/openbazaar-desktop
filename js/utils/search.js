import _ from 'underscore';
import app from '../app';
import $ from 'jquery';
import sanitizeHtml from 'sanitize-html';
import is from 'is_js';
import { Events } from 'backbone';
import ProviderMd from '../models/search/SearchProvider';

const events = {
  ...Events,
};

/**
 * Create a search query URL.
 * @param {object} options.provider - The provider model.
 * @param {string} options.urlType - The type of endpoint to use.
 * @param {string} options.term - The term(s) to search for.
 * @param {string} options.page - The page to returns results for.
 * @param {string} options.pageSize - The number of results per page.
 * @param {string} options.sortBy - The parameter to sort the results by.
 * @param {object} options.filters - A set of filter keys and values in formData format.
 *
 * @returns {xhr}
 */
export function createSearchURL(options = {}) {
  if (!options.provider || !(options.provider instanceof ProviderMd)) {
    throw new Error('Please provide a provider model.');
  }
  if (!options.urlType || is.not.string(options.urlType)) {
    throw new Error('Please provide an urlType for the search endpoint.');
  }

  const opts = {
    p: 0,
    ps: 66,
    network: !!app.serverConfig.testnet ? 'testnet' : 'mainnet',
    filters: {},
    ...options,
  };

  const baseUrl = opts.provider[opts.urlType];

  const query = { ..._.pick(opts, ['q', 'p', 'ps', 'sortBy', 'network']) };
  query.q = query.q || '*';

  return new URL(`${baseUrl}?${$.param(query, true)}&${$.param(opts.filters, true)}`);
}

/**
 * Create a search query and return the results.
 * @param {string} url - The url endpoint to use.
 *
 * @returns {xhr}
 */
export function fetchSearchResults(url) {
  const xhr = $.get({
    url,
    dataType: 'json',
  });

  events.trigger('fetchingSearchResults', { xhr });

  return xhr;
}

/**
 * Sanitize search results.
 * @param {object} data - Data object returned from a search query.
 *
 * @returns {object} - The same object, but with sanitized strings.
 */
export function sanitizeResults(data) {
  return JSON.stringify(data, (key, val) => {
    // sanitize the data from any dangerous characters
    if (typeof val === 'string') {
      return sanitizeHtml(val, {
        allowedTags: [],
        allowedAttributes: [],
      });
    }
    return val;
  });
}

/**
 * Creates an object for updating search providers with new data returned from a query.
 * @param {object} data - Provider object from a search query.
 * @returns {{data: *, urlTypes: Array}}
 */
export function buildProviderUpdate(data) {
  const update = {};
  const urlTypes = [];

  if (data.name && is.string(data.name)) update.name = data.name;
  if (data.logo && is.url(data.logo)) update.logo = data.logo;
  if (data.links) {
    if (is.url(data.links.vendors)) {
      update.vendors = data.links.vendors;
      urlTypes.push('vendors');
    }
    if (is.url(data.links.listings)) {
      update.listings = data.links.listings;
      urlTypes.push('listings');
    }
    if (is.url(data.links.reports)) {
      update.reports = data.links.reports;
      urlTypes.push('reports');
    }
    if (data.links.tor) {
      if (is.url(data.links.tor.listings)) {
        update.torListings = data.links.tor.listings;
        urlTypes.push('torlistings');
      }
      if (is.url(data.links.tor.vendors)) {
        update.torVendors = data.links.tor.vendors;
        urlTypes.push('torVendors');
      }
      if (is.url(data.links.tor.reports)) {
        update.torReports = data.links.tor.reports;
        urlTypes.push('torReports');
      }
    }
  }

  return {
    update,
    urlTypes,
  };
}
