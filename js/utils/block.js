import $ from 'jquery';
import { Model, Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import { isMultihash } from '../utils';
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
let pendingBlocks = [];
let pendingUnblocks = [];

// FYI - The extra complexity in this method is due to the fact that for the block API
// you are sending the full list rather than individual items you want to unblock / unblock
// and that gets interesting if you kick off a subsequent request while a previous is still
// pending and, for example, the previous may fail whereas the subsequent (which includes
// the block/unblock from the previous) may succeed.
function blockUnblock(_block, peerIds) {
  if (typeof _block !== 'boolean') {
    throw new Error('Please provide _block as a boolean.');
  }

  if (!isMultihash(peerIds) && !Array.isArray(peerIds)) {
    throw new Error('Either provide a single peerId as a multihash or an array of peerId ' +
      'multihashes.');
  }

  if (Array.isArray(peerIds)) {
    peerIds.forEach(peerId => {
      if (!isMultihash(peerId)) {
        throw new Error('If providing an array of peerIds, each item must be a multihash.');
      }
    });
  }

  checkAppSettings();

  let peerIdList =
    typeof peerIds === 'string' ? [peerIds] : peerIds;

  if (_block && app.profile && peerIdList.includes(app.profile.id)) {
    throw new Error('You cannot block your own node.');
  }

  // de-dupe peerId list
  peerIdList = Array.from(new Set(peerIdList));

  let blockedNodes; // if _block is false, semantically this means unblockedNodes

  if (_block) {
    blockedNodes = [
      ...(
        latestSettingsSave && latestSettingsSave.state() === 'pending' ?
          lastSentBlockedNodes : app.settings.get('blockedNodes')
      ),
      ...peerIdList,
    ];
    pendingBlocks = [...pendingBlocks, ...peerIdList];
    pendingUnblocks = pendingUnblocks.filter(peerId => !peerIdList.includes(peerId));
  } else {
    const filterList = latestSettingsSave && latestSettingsSave.state() === 'pending' ?
      lastSentBlockedNodes : app.settings.get('blockedNodes');
    blockedNodes = filterList.filter(peerId => !peerIdList.includes(peerId));
    pendingUnblocks = [...pendingUnblocks, ...peerIdList];
    pendingBlocks = pendingBlocks.filter(peerId => !peerIdList.includes(peerId));
  }

  lastSentBlockedNodes = [...blockedNodes];

  latestSettingsSave = $.ajax({
    type: 'PATCH',
    url: app.getServerUrl('ob/settings/'),
    data: JSON.stringify({ blockedNodes }),
    dataType: 'json',
  }).done(() => {
    app.settings.set('blockedNodes', blockedNodes);
    const blocked = [];
    const unblocked = [];

    pendingBlocks = pendingBlocks.filter(peerId => {
      if (blockedNodes.includes(peerId)) {
        blocked.push(peerId);
        return false;
      }

      return true;
    });

    pendingUnblocks = pendingUnblocks.filter(peerId => {
      if (!blockedNodes.includes(peerId)) {
        unblocked.push(peerId);
        return false;
      }

      return true;
    });

    if (blocked.length) {
      events.trigger('blocked', { peerIds: blocked });
    }

    if (unblocked.length) {
      events.trigger('unblocked', { peerIds: unblocked });
    }
  }).fail(xhr => {
    if (latestSettingsSave && latestSettingsSave.state() === 'pending') return;

    const reason = xhr.responseJSON && xhr.responseJSON.reason || '';
    const bn = app.settings.get('blockedNodes');
    const failedBlocks = pendingBlocks.filter(peerId => !bn.includes(peerId));
    const failedUnblocks = pendingUnblocks.filter(peerId => bn.includes(peerId));
    pendingBlocks = [];
    pendingUnblocks = [];

    if (failedBlocks.length) {
      events.trigger('blockFail', {
        peerIds: failedBlocks,
        reason,
      });
    }

    if (failedUnblocks.length) {
      events.trigger('unblockFail', {
        peerIds: failedUnblocks,
        reason,
      });
    }

    if (failedBlocks.length || failedUnblocks.length) {
      let title;
      let body;

      if (failedBlocks.length && failedUnblocks.length) {
        title = app.polyglot.t('block.errorModal.titleUnableToBlockUnblock');
        body = `${app.polyglot.t('block.errorModal.blockFailedListHeading')}<br /><br />` +
          `<div class="txCtr">${failedBlocks.join('<br />')}</div><br />` +
          `${app.polyglot.t('block.errorModal.unblockFailedListHeading')}<br /><br />` +
          `<div class="txCtr">${failedUnblocks.join('<br />')}</div>`;
      } else if (failedUnblocks.length) {
        title = app.polyglot.t('block.errorModal.titleUnableToUnblock');
        body = `${app.polyglot.t('block.errorModal.unblockFailedListHeading')}<br /><br />` +
          `<div class="txCtr">${failedUnblocks.join('<br />')}</div>`;
      } else {
        title = app.polyglot.t('block.errorModal.titleUnableToBlock');
        body = `${app.polyglot.t('block.errorModal.blockFailedListHeading')}<br /><br />` +
          `<div class="txCtr">${failedBlocks.join('<br />')}</div>`;
      }

      if (reason) {
        body += `<br />${app.polyglot.t('block.errorModal.reason', { reason })}`;
      }

      openSimpleMessage(title, '', { messageHtml: body });
    }
  });

  events.trigger(_block ? 'blocking' : 'unblocking', { peerIds: peerIdList });
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
    lastSentBlockedNodes.includes(peerId) || false;
}

export function isUnblocking(peerId) {
  if (typeof peerId !== 'string') {
    throw new Error('Please provide a peerId as a string.');
  }

  checkAppSettings();

  return latestSettingsSave && latestSettingsSave.state() === 'pending' &&
    !lastSentBlockedNodes.includes(peerId) &&
    app.settings.get('blockedNodes').includes(peerId) || false;
}
