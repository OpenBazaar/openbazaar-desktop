// Object where we can (very judiciously) attach any app-wide
// shared state (e.g. router)

import $ from 'jquery';

export default {
  getServerUrl(urlFrag = '') {
    // until we implement our server connect flow,
    // we'll just hard code default server values.
    return `http://localhost:8080/${urlFrag}`;
  },

  // temporary until we implement our full server connection flow
  getSocketUrl() {
    return 'ws://localhost:8080/ws';
  },

  followUnfollow(guid, type = 'follow') {
    if (typeof guid !== 'string' || !guid.toLowerCase().startsWith('qm')) {
      throw new Error('You must provide a valid guid.');
    }

    const call = $.ajax({
      type: 'POST',
      url: this.getServerUrl(`ob/${type}`),
      data: JSON.stringify({ id: guid }),
      dataType: 'json',
    });

    return call;
  },
};
