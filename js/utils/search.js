import _ from 'underscore';
import app from '../app';
import $ from 'jquery';
import sanitizeHtml from 'sanitize-html';
import ProviderMd from '../models/search/SearchProvider';

export const searchTypes = ['listings', 'vendors'];

/**
 * Create a search query URL.
 * @param {object} options.provider - The provider model.
 * @param {string} options.term - The term(s) to search for.
 * @param {string} options.page - The page to returns results for.
 * @param {string} options.pageSize - The number of results per page.
 * @param {string} options.sortBy - The parameter to sort the results by.
 * @param {object} options.filters - A set of filter keys and values in formData format.
 *
 * @returns {string} - a search URL with query parameters.
 */
export function createSearchURL(options = {}) {
  if (!options.provider || !(options.provider instanceof ProviderMd)) {
    throw new Error('Please provide a provider model.');
  }
  if (!searchTypes.includes(options.searchType)) {
    throw new Error('Please provide a valid search type.');
  }

  const opts = {
    p: 0,
    ps: 66,
    filters: {},
    ...options,
  };

  const query = { ..._.pick(opts, ['q', 'p', 'ps', 'sortBy']), ...opts.filters };
  query.q = query.q || '*';
  query.network = !!app.serverConfig.testnet ? 'testnet' : 'mainnet';

  return new URL(`${opts.provider[`${options.searchType}Url`]}?${$.param(query, true)}`);
}
