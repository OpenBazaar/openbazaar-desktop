// for now, putting one-off util functions that I don't know where
// else to put here.

import $ from 'jquery';
import _ from 'underscore';

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

// http://stackoverflow.com/a/18937118/632806
// todo: unit test
export function setDeepValue(obj, path, value) {
  let schema = obj;  // a moving reference to internal objects within obj
  const pList = path.split('.');
  const len = pList.length;

  for (let i = 0; i < len - 1; i++) {
    const elem = pList[i];
    if (!schema[elem]) schema[elem] = {};
    schema = schema[elem];
  }

  schema[pList[len - 1]] = value;
}

// http://stackoverflow.com/a/2686098/632806
// todo: unit test
export function abbrNum(_number, _decPlaces = 1) {
  // 2 decimal places => 100, 3 => 1000, etc
  const decPlaces = Math.pow(10, _decPlaces);
  let number = _number;

  // Enumerate number abbreviations
  const abbrev = ['k', 'm', 'b', 't'];

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

      // Add the letter for the abbreviation
      number += abbrev[i];

      // We are done... stop
      break;
    }
  }

  return number;
}
