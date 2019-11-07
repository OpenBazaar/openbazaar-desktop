import $ from 'jquery';

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

/*
 * Deletes any property in the object with the name of key at
 * any level of nesting.
 */
// http://stackoverflow.com/a/34607791/632806
export function removeProp(obj, key) {
  if (typeof obj !== 'object') return obj;

  Object.keys(obj).forEach(i => {
    if (Array.isArray(obj[i])) {
      obj[i].forEach(item => removeProp(item, key));
    } else if (i === key) {
      delete obj[i];
    } else if (typeof obj[i] === 'object') {
      removeProp(obj[i], key);
    }
  });

  return obj;
}

/*
 * Return true if obj is a promise.
 */
// https://stackoverflow.com/a/13075985/632806
export function isPromise(obj) {
  return typeof obj === 'object' &&
    typeof obj.then === 'function';
}

/*
 * Return true if obj is a promise / deffered.
 */
// https://stackoverflow.com/a/13075985/632806
export function isJQPromise(value) {
  if (typeof value === 'object' && typeof value.then !== 'function') {
    return false;
  }
  const promiseThenSrc = String($.Deferred().then);
  const valueThenSrc = String(value.then);
  return promiseThenSrc === valueThenSrc;
}
