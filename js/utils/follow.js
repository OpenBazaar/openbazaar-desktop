import $ from 'jquery';
import app from '../app';
import Dialog from '../views/modals/Dialog';

export function followedByYou(guid) {
  return !!app.ownFollowing.get(guid);
}

export function followsYou(guid) {
  if (!guid) {
    throw new Error('Please provide a guid');
  }

  return $.get(`${app.getServerUrl(`ob/followsme/${guid}`)}`);
}

export function followUnfollow(guid, type = 'follow') {
  if (typeof guid !== 'string' || !guid.toLowerCase().startsWith('qm')) {
    throw new Error('You must provide a valid guid.');
  }

  if (guid === app.profile.id) {
    throw new Error('You can not follow or unfollow your own guid');
  }

  return $.ajax({
    type: 'POST',
    url: app.getServerUrl(`ob/${type}`),
    data: JSON.stringify({ id: guid }),
    dataType: 'json',
  })
    .done(() => {
      // if the call succeeds, add or remove the guid from the collection
      if (type === 'follow') {
        app.ownFollowing.unshift({ guid });
      } else {
        app.ownFollowing.remove(guid); // remove via id
      }
    })
    .fail((data) => {
      // todo: more specific error title.
      new Dialog({
        title: app.polyglot.t('errors.badResult'),
        message: data.responseJSON.reason,
      })
        .render()
        .open();
    });
}
