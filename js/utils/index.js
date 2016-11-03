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
