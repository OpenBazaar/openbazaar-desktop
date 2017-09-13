import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';

export default class extends Collection {
  url() {
    return app.getServerUrl('ob/notifications');
  }

  parse(response) {
    return response.notifications.map(notif => {
      const innerNotif = notif.notification;

      return {
        id: innerNotif.notificationId,
        notification: _.omit(innerNotif, 'notificationId'),
        ...notif,
      };
    });
  }

  comparator(message) {
    return message.get('timestamp');
  }
}

/**
 * Based on a notification's data, this function will determine what text
 * the notification should be displayed with and what route it should link to.
 * Based on option.native, it will tailor the text for it to be used on a native
 * JS notification or our internal app one (the former can't contain html).
 *
 * @param {object} attrs - The notification data, If you have a Notification model,
 *   then this is the embedded notification object (i.e. this.model.toJSON().notification).
 * @param {object} [options={}]
 * @return {object} An object containting text and route properties.
 */
export function getNotifDisplayData(attrs, options = {}) {
  if (typeof attrs !== 'object') {
    throw new Error('Please provide an object with notification data.');
  }

  const opts = {
    native: false,
    ...options,
  };

  let text = '';
  let route = '';

  const getName = (handle, guid) => handle && `@${handle}` || `${guid.slice(0, 8)}…`;

  if (attrs.type === 'order') {
    const buyerName = opts.native ?
      getName(attrs.buyerHandle, attrs.buyerId) :
      `<a class="clrTEm" href="#${attrs.buyerId}">${getName(attrs.buyerHandle, attrs.buyerId)}</a>`;
    const listingTitle = opts.native ?
      attrs.title :
      `<a class="clrTEm" href="#${app.profile.id}/store/${attrs.slug}">${attrs.title}</a>`;

    route = `#transactions/sales?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.order', {
      buyerName,
      listingTitle,
    });
  } else if (attrs.type === 'payment') {
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.payment');
  } else if (attrs.type === 'orderConfirmation') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.orderConfirmation', {
      vendorName,
    });
  } else if (attrs.type === 'declined') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.declined', {
      vendorName,
    });
  } else if (attrs.type === 'canceled') {
    const buyerName = opts.native ?
      getName(attrs.buyerHandle, attrs.buyerId) :
      `<a class="clrTEm" href="#${attrs.buyerId}">` +
        `${getName(attrs.buyerHandle, attrs.buyerId)}</a>`;
    route = `#transactions/sales?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.canceled', {
      buyerName,
    });
  } else if (attrs.type === 'refund') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.refunded', {
      vendorName,
    });
  } else if (attrs.type === 'fulfillment') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.fulfillment', {
      vendorName,
    });
  } else if (attrs.type === 'orderComplete') {
    const buyerName = opts.native ?
      getName(attrs.buyerHandle, attrs.buyerId) :
      `<a class="clrTEm" href="#${attrs.buyerId}">${getName(attrs.buyerHandle, attrs.buyerId)}</a>`;
    route = `#transactions/sales?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.orderComplete', {
      buyerName,
    });
  } else if (attrs.type === 'disputeOpen') {
    if (attrs.disputeeId === app.profile.id) {
      // notif received by disputee
      const disputerName = opts.native ?
        getName(attrs.disputerHandle, attrs.disputerId) :
        `<a class="clrTEm" href="#${attrs.disputerId}">` +
          `${getName(attrs.disputerHandle, attrs.disputerId)}</a>`;
      route = `#transactions/${attrs.buyer === attrs.disputerId ? 'purchases' : 'sales'}` +
        `?orderId=${attrs.orderId}`;
      text = app.polyglot.t('notifications.text.disputeOpen', {
        disputerName,
      });
    } else {
      // you are the mod receiving this notification
      const disputerName = opts.native ?
        getName(attrs.disputerHandle, attrs.disputerId) :
        `<a class="clrTEm" href="#${attrs.disputerId}">` +
          `${getName(attrs.disputerHandle, attrs.disputerId)}</a>`;
      const disputeeName = opts.native ?
        getName(attrs.disputeeHandle, attrs.disputeeId) :
        `<a class="clrTEm" href="#${attrs.disputeeId}">` +
          `${getName(attrs.disputeeHandle, attrs.disputeeId)}</a>`;

      route = `#transactions/cases?caseId=${attrs.orderId}`;
      text = app.polyglot.t('notifications.text.disputeOpenMod', {
        disputerName,
        disputeeName,
      });
    }
  } else if (attrs.type === 'disputeUpdate') {
    const disputerName = opts.native ?
      getName(attrs.disputerHandle, attrs.disputerId) :
      `<a class="clrTEm" href="#${attrs.disputerId}">` +
        `${getName(attrs.disputerHandle, attrs.disputerId)}</a>`;
    const disputeeName = opts.native ?
      getName(attrs.disputeeHandle, attrs.disputeeId) :
      `<a class="clrTEm" href="#${attrs.disputeeId}">` +
        `${getName(attrs.disputeeHandle, attrs.disputeeId)}</a>`;
    route = `#transactions/cases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.disputeUpdate', {
      disputerName,
      disputeeName,
    });
  } else if (attrs.type === 'disputeClose') {
    const otherPartyName = opts.native ?
      getName(attrs.otherPartyHandle, attrs.otherPartyId) :
      `<a class="clrTEm" href="#${attrs.buyerId}">` +
        `${getName(attrs.otherPartyHandle, attrs.otherPartyId)}</a>`;
    route = `#transactions/${attrs.buyer === attrs.otherPartyId ? 'purchases' : 'sales'}` +
      `?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.disputeClose', {
      otherPartyName,
    });
  } else if (attrs.type === 'disputeAccepted') {
    const otherPartyName = opts.native ?
      getName(attrs.otherPartyHandle, attrs.otherPartyId) :
      `<a class="clrTEm" href="#${attrs.buyerId}">` +
        `${getName(attrs.otherPartyHandle, attrs.otherPartyId)}</a>`;
    route = `#transactions/${attrs.buyer === attrs.otherPartyId ? 'purchases' : 'sales'}` +
      `?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.disputeAccepted', {
      otherPartyName,
    });
  } else if (attrs.type === 'follow' || attrs.type === 'moderatorAdd' ||
    attrs.type === 'moderatorRemove') {
    const name = opts.native ?
      getName(attrs.handle, attrs.peerId) :
      `<a class="clrTEm" href="#${attrs.peerId}">${getName(attrs.handle, attrs.peerId)}</a>`;
    route = `#${attrs.peerId}`;
    text = app.polyglot.t(`notifications.text.${attrs.type}`, {
      name,
    });
  }

  return {
    text,
    route,
  };
}
