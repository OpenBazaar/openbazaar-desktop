// for now, putting one-off util functions that I don't know where
// else to put here.

import $ from 'jquery';
import _ from 'underscore';
import app from '../app';
import multihashes from 'multihashes';
import twemoji from 'twemoji';

export function getGuid(handle, resolver) {
  const deferred = $.Deferred();
  let url = resolver || app.getServerUrl('ob/resolve');

  if (!handle) {
    throw new Error('Please provide a handle.');
  }

  url = url.charAt(url.length - 1) !== '/' ? `${url}/` : url;
  url += handle;

  $.get(url).done(peerId => deferred.resolve(peerId))
    .fail(xhr => deferred.reject(xhr));

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

// todo: move to the number util mod...?
// http://stackoverflow.com/a/2686098/632806
export function abbrNum(_number, _maxDecPlaces = 1) {
  if (typeof _number !== 'number' || isNaN(_number)) {
    return '';
  }

  // 2 decimal places => 100, 3 => 1000, etc
  const decPlaces = Math.pow(10, _maxDecPlaces);
  const isNegative = _number < 0;
  let number = Math.abs(_number);
  let processed = false;
  let lang = app && app.localSettings && app.localSettings.standardizedTranslatedLang();

  if (!lang) {
    console.warn('Unable to get the languages from the local settings. Using en-US.');
    lang = 'en-US';
  }

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

      number = new Intl.NumberFormat(lang).format(isNegative ? number * -1 : number);
      number = app.polyglot.t(`abbreviatedNumbers.${abbrev[i]}`, { number });

      // We are done... stop
      processed = true;
      break;
    }
  }

  if (!processed) {
    number = new Intl.NumberFormat(lang).format(isNegative ? number * -1 : number);
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

export function isMultihash(_string) {
  try {
    multihashes.validate(multihashes.fromB58String(_string));
    return true;
  } catch (exc) {
    return false;
  }
}

// applies a template to select2 to turn text emojis into images
export function selectEmojis(option) {
  return $(`<span class="select2ImgOpt">${twemoji.parse(option.text,
      icon => (`../imgs/emojis/72X72/${icon}.png`))}</span>`);
}

/*
 * If you need to set an interval to update a relative timestamp, this function
 * will smartly decide how often to ping you based on the age of the timestamp.
 * This is important if you have a list of many (dozens, hundreds, etc...) items
 * which would otherwise result in an excess of potentially CPU intensive intervals.
 * @param {string} timestamp
 * @param {function} cb Your callback function that will be called periodically and in which
 * you will likely re-calculate and update your time ago text (e.g. a few seconds ago =>
 * 1 minute ago)
 * @param {array} _timeouts Ignore this argument. It is used internally.
 * @returns {Object} An object with a cancel function so you could cancel this function from
 * calling your callback when you no longer need it. If you initiate this from a view, you would
 * want to call cancel in View.remove().
 */
export function setTimeagoInterval(timestamp, cb, _timeouts = []) {
  if (!timestamp) {
    throw new Error('Please provide a timestamp.');
  }

  if (typeof cb !== 'function') {
    throw new Error('Please provide a callback function.');
  }

  const age = Date.now() - (new Date(timestamp)).getTime();

  const pushTimeout = (time) => {
    const timeout = setTimeout(() => {
      cb();
      setTimeagoInterval(timestamp, cb, _timeouts);
    }, time);

    _timeouts.push(timeout);
  };

  if (age < 1000 * 60 * 60) {
    // less than an hour old
    pushTimeout(1000 * 20); // check in 20 seconds
  } else if (age < 1000 * 60 * 60 * 24) {
    // less than a day old
    pushTimeout(1000 * 60 * 15); // check in 15 minutes
  } else if (age < 1000 * 60 * 60 * 24 * 30) {
    // less than 30 days old
    pushTimeout(1000 * 60 * 60 * 2); // check in 2 hours
  } else {
    // more than 30 days old
    pushTimeout(1000 * 60 * 60 * 24); // check in a day
  }

  return {
    cancel: () => {
      _timeouts.forEach(timeout => (clearTimeout(timeout)));
    },
  };
}

/*
 * Will turn a url encoded query string into a JS object. The opposite of
 * $.param().
 */
export function deparam(queryStr = '') {
  const parsed = {};
  const params = new URLSearchParams(queryStr);

  for (const pair of params.entries()) {
    parsed[pair[0]] = pair[1];
  }

  return parsed;
}
