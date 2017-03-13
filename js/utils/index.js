// for now, putting one-off util functions that I don't know where
// else to put here.

import $ from 'jquery';
import _ from 'underscore';
import app from '../app';

export function getGuid(handle, resolver) {
  const deferred = $.Deferred();
  let url = resolver || 'https://resolver.onename.com/v2/users/';

  if (!handle) {
    throw new Error('Please provide a handle.');
  }

  url = url.charAt(url.length - 1) !== '/' ? `${url}/` : url;
  url += handle;

  $.get(url).done((data) => {
    if (data && data[handle] && data[handle].profile && data[handle].profile.account) {
      const account = data[handle].profile.account.filter(
        (accountObject) => accountObject.service === 'openbazaar');

      deferred.resolve(account[0].identifier);
    } else {
      deferred.reject();
    }
  }).fail(() => {
    deferred.reject();
  });

  return deferred.promise();
}


// https://www.quora.com/How-do-I-split-a-JSON-array-on-different-rows-in-angularjs/answer/Steve-Schafer-2?srid=G5Pv
/*
 * Splits an array into rows (an array of arrays)
 */
export function splitIntoRows(items, itemsPerRow) {
  if (!_.isArray(items)) {
    throw new Error('Please provide an array of items');
  }

  if (!_.isNumber(itemsPerRow)) {
    throw new Error('Please provide a number representing the items per row.');
  }

  const rslt = [];

  items.forEach((item, index) => {
    const rowIndex = Math.floor(index / itemsPerRow);
    const colIndex = index % itemsPerRow;

    if (!rslt[rowIndex]) {
      rslt[rowIndex] = [];
    }

    rslt[rowIndex][colIndex] = item;
  });

  return rslt;
}

// http://stackoverflow.com/a/2686098/632806
// todo: unit test
export function abbrNum(_number, _decPlaces = 1) {
  // 2 decimal places => 100, 3 => 1000, etc
  const decPlaces = Math.pow(10, _decPlaces);
  let number = _number;

  // Enumerate number abbreviations
  const abbrev = ['thousand', 'million', 'billion', 'trillion'];

  // Go through the array backwards, so we do the largest first
  for (let i = abbrev.length - 1; i >= 0; i--) {
    // Convert array index to "1000", "1000000", etc
    const size = Math.pow(10, (i + 1) * 3);

    // If the number is bigger or equal do the abbreviation
    if (size <= number) {
      // Here, we multiply by decPlaces, round, and then divide by decPlaces.
      // This gives us nice rounding to a particular decimal place.
      number = Math.round(number * decPlaces / size) / decPlaces;

      // Handle special case where we round up to the next abbreviation
      if ((number === 1000) && (i < abbrev.length - 1)) {
        number = 1;
        i++;
      }

      let lang = app && app.settings && app.settings.get('language');

      if (!lang) {
        console.warn('Unable to get the languages from the settings. Using en-US.');
        lang = 'en-US';
      }

      number = new Intl.NumberFormat(lang).format(number);
      number = app.polyglot.t(`abbreviatedNumbers.${abbrev[i]}`, { number });

      // We are done... stop
      break;
    }
  }

  return number;
}

// https://github.com/jeromegn/Backbone.localStorage
// Generate four random hex digits.
function s4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// https://github.com/jeromegn/Backbone.localStorage
// Generate a pseudo-GUID by concatenating random hexadecimal.
// This has nothing to do with an OB guid / peerId. This is is just a
// generic way to generate a unique identifier.
export function guid(prefix = '') {
  return `${prefix}${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
