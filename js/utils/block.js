import $ from 'jquery';
import { Model, Events } from 'backbone';
import app from '../app';

const events = {
  ...Events,
};

export { events };

function checkAppSettings() {
  if (!app || !(app.settings instanceof Model)) {
    throw new Error('app.settings must be a model.');
  }

  if (!Array.isArray(app.settings.get('blockedNodes'))) {
    throw new Error('app.settings.blockedNodes must be set as an array.');
  }
}

let latestSettingsSave;
let lastSentBlockedNodes = [];

function blockUnblock(_block, peerIds) {
  if (typeof _block !== 'boolean') {
    throw new Error('Please provide _block as a boolean.');
  }

  if (typeof peerIds !== 'string' && !Array.isArray(peerIds)) {
    throw new Error('Either provide a single peerId as a string or an array of peerId strings.');
  }

  if (_block && app.profile && peerIds.includes(app.profile.id)) {
    throw new Error('You cannot block your own node.');
  }

  checkAppSettings();

  const peerIdList =
    typeof peerIds === 'string' ? [peerIds] : peerIds;

  const prevBlocked = app.settings.get('blockedNodes');

  let blockedNodes; // if _block is false, semantically this means unblockedNodes

  if (_block) {
    blockedNodes = lastSentBlockedNodes = [
      ...(
        latestSettingsSave && latestSettingsSave.state() === 'pending' ?
          lastSentBlockedNodes : prevBlocked
      ),
      ...peerIdList,
    ];
  } else {
    const filterList = latestSettingsSave && latestSettingsSave.state() === 'pending' ?
      lastSentBlockedNodes : prevBlocked;
    blockedNodes = lastSentBlockedNodes =
      filterList.filter(peerId => !peerIdList.includes(peerId));
  }

  latestSettingsSave = $.ajax({
    type: 'PATCH',
    url: app.getServerUrl('ob/settings/'),
    data: JSON.stringify({ blockedNodes }),
    dataType: 'json',
  }).done(() => {
    app.settings.set('blockedNodes', blockedNodes);
    events.trigger(_block ? 'blocked' : 'unblocked', { peerIds: peerIdList });
  }).fail(xhr => {
    let failedPeerIds = [];

    if (xhr === latestSettingsSave) {
      failedPeerIds = [...peerIdList];
    } else {
      if (_block) {
        failedPeerIds = peerIdList.filter(peerId => !lastSentBlockedNodes.includes(peerId));
      } else {
        failedPeerIds = peerIdList.filter(peerId => lastSentBlockedNodes.includes(peerId));
      }
    }

    if (failedPeerIds.length) {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || '';
      events.trigger('blockFail', {
        peerIds: failedPeerIds,
        reason,
      });
      alert(`Block has failed for ${failedPeerIds.join(', ')} with reason '${reason}'`);
    }
  });

  return latestSettingsSave; // for now BLAH blAh BliZZle.
}

export function block(peerIds) {
  blockUnblock(true, peerIds);
}

export function unblock(peerIds) {
  blockUnblock(false, peerIds);
}

export function isBlocked(peerId) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.');
  }

  checkAppSettings();

  return app.settings.get('blockedNodes').includes(peerId);
}

export function isBlocking(peerId) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.');
  }

  checkAppSettings();

  return latestSettingsSave && latestSettingsSave.state() === 'pending' &&
    lastSentBlockedNodes.includes(peerId);
}

export function isUnblocking(peerId) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.');
  }

  checkAppSettings();

  return latestSettingsSave && latestSettingsSave.state() === 'pending' &&
    !lastSentBlockedNodes.includes(peerId) &&
    app.settings.get('blockedNodes').includes(peerId);
}
