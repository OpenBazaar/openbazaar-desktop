import $ from 'jquery';
import { getCurrentConnection } from './serverConnect';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import { Events } from 'backbone';
import app from '../app';

const events = {
  ...Events,
};

// If you change this, be sure to change anywhere in the GUI you may have output how
// long its unavailable (e.g. Advanced Settings).
const resyncInactiveTime = 1000 * 60 * 60 * 1;

/**
 * Resync will be disabled if one was executed by this module less than the time specificed
 * in this.resyncInactiveTime. resyncBlockchain to remain flexible does not enforce this.
 * If you are exposing resync function in the GUI, you probably want to disable them based
 * on this function.
 */
export function isResyncAvailable() {
  const currConn = getCurrentConnection();

  if (currConn && currConn.server) {
    const lastBlockchainResync = currConn.server.get('lastBlockchainResync');
    if (lastBlockchainResync &&
      (Date.now() - (new Date(lastBlockchainResync).getTime())) < resyncInactiveTime) {
      return false;
    }
  }

  return true;
}

let resyncPost;

export default function resyncBlockchain() {
  if (resyncPost && resyncPost.state() === 'pending') return resyncPost;

  const currConn = getCurrentConnection();

  const post = $.post(app.getServerUrl('wallet/resyncblockchain'))
    .fail((xhr) => {
      if (xhr.statusText === 'abort') return;
      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('resyncFail'),
        failReason);
      events.trigger('resyncFail', { xhr: post });
    })
    .done(() => {
      events.trigger('resyncComplete', { xhr: post });

      if (currConn && currConn.server) {
        currConn.server.save('lastBlockchainResync', (new Date()).getTime());
      }
    });

  events.trigger('resyncing', { xhr: post });

  return post;
}

export function isResyncingBlockchain() {
  return resyncPost && resyncPost.state() === 'pending';
}
