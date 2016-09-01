// Object where we can (very judiciously) attach any app-wide
// shared state (e.g. router)

import $ from 'jquery';
import Dialog from './views/modals/Dialog';

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

    if (guid === this.profile.id) {
      throw new Error('You can not follow or unfollow your own guid');
    }

    return $.ajax({
      type: 'POST',
      url: this.getServerUrl(`ob/${type}`),
      data: JSON.stringify({ id: guid }),
      dataType: 'json',
    })
    .done(() => {
      // if the call succeeds, add or remove the guid from the collection
      if (type === 'follow') {
        this.ownFollowing.add({ guid });
      } else {
        this.ownFollowing.remove({ guid });
      }
    })
    .fail((data) => {
      const followFailedDialog = new Dialog({   // eslint-disable-line no-unused-vars
        title: this.polyglot.t('errors.badResult'),
        message: data.responseJSON.reason,
        dismissOnOverlayClick: true,
        dismissOnEscPress: true,
        showCloseButton: true,
      })
        .render()
        .open();
    });
  },
};
