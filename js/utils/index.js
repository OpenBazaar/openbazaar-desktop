// for now, putting one-off util functions that I don't know where
// else to put here.

import $ from 'jquery';

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
