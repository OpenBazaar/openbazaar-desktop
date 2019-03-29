import app from '../app';
import $ from 'jquery';
import sanitizeHtml from 'sanitize-html';
import is from 'is_js';
import { Events } from 'backbone';

const events = {
  ...Events,
};

/** Create a search query URL.
 *
 * @param {string} options.providerUrl - The url endpoint to use, without any parameters.
 * @param {string} options.term - The term(s) to search for.
 * @param {string} options.page - The page to returns results for.
 * @param {string} options.pageSize - The number of results per page.
 * @param {string} options.sortBy - The parameter to sort the results by.
 * @param {object} options.filters - A set of filter keys and values in formData format.
 *
 * @returns {xhr}
 */
export function createSearchURL(options = {}) {
  if (!options.providerUrl || is.not.url(options.providerUrl)) {
    throw new Error('Please provide a base url for the search endpoint.');
  }

  const opts = {
    providerUrl: '',
    term: '*',
    page: 0,
    pageSize: 66,
    network: !!app.serverConfig.testnet ? 'testnet' : 'mainnet',
    sortBy: '',
    filters: {},
    ...options,
  };

  const query = `q=${encodeURIComponent(opts.term)}`;
  const network = `&network=${opts.network}`;
  const sortBy = opts.sortBy ? `&sortBy=${encodeURIComponent(opts.sortBy)}` : '';
  const page = `&p=${opts.page}&ps=${opts.pageSize}`;
  const filters = opts.filters ? `&${$.param(opts.filters, true)}` : '';

  return new URL(`${opts.providerUrl}?${query}${network}${sortBy}${page}${filters}`);
}

/** Create a search query and return the results.
 *
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

/** Sanitize search results.
 *
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

/** Creates an object for updating search providers with new data returned from a query.
 *
 * @param {object} data - Provider object from a search query.
 * @returns {{data: *, urlTypes: Array}}
 */
export function buildProviderUpdate(data) {
  const update = {};
  const urlTypes = [];

  if (data.name && is.string(data.name)) update.name = data.name;
  if (data.logo && is.url(data.logo)) update.logo = data.logo;
  if (data.links) {
    if (is.url(data.links.search)) {
      update.search = data.links.search;
      urlTypes.push('search');
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
      if (is.url(data.links.tor.search)) {
        update.torsearch = data.links.tor.search;
        urlTypes.push('torsearch');
      }
      if (is.url(data.links.tor.listings)) {
        update.torlistings = data.links.tor.listings;
        urlTypes.push('torlistings');
      }
    }
  }

  return {
    update,
    urlTypes,
  };
}
