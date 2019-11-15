import _ from 'underscore';
import moment from 'moment';
import { capitalize } from '../utils/string';
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
    // Check for the new 'orderDeclined' value, but maintain compatibility with older notifications.
  } else if (attrs.type === 'orderDeclined' || attrs.type === 'declined') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.declined', {
      vendorName,
    });
    // Check for the new 'cancel' value, but maintain compatibility with older notifications.
  } else if (attrs.type === 'cancel' || attrs.type === 'cancelled') {
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
  } else if (attrs.type === 'processingError') {
    const vendorName = opts.native ?
      getName(attrs.vendorHandle, attrs.vendorId) :
      `<a class="clrTEm" href="#${attrs.vendorId}">` +
        `${getName(attrs.vendorHandle, attrs.vendorId)}</a>`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.processingError', {
      vendorName,
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
      `<a class="clrTEm" href="#${attrs.otherPartyId}">` +
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
  } else if ([
    'vendorDisputeTimeout',
    'buyerDisputeTimeout',
    'buyerDisputeExpiry',
    'moderatorDisputeExpiry',
  ].includes(attrs.type)) {
    const prevMomentDaysThreshold = moment.relativeTimeThreshold('d');
    let orderIdKey = 'orderId';

    if (attrs.type === 'vendorDisputeTimeout') {
      orderIdKey = 'purchaseOrderId';
    } else if (attrs.type === 'moderatorDisputeExpiry') {
      orderIdKey = 'disputeCaseId';
    }

    const orderIdShort = `#${attrs[orderIdKey].slice(0, 4)}…`;
    let transactionTab = 'sales';
    let orderApiFilter = 'orderId';

    if ([
      'buyerDisputeTimeout',
      'buyerDisputeExpiry',
    ].includes(attrs.type)) {
      transactionTab = 'purchases';
    } else if (attrs.type === 'moderatorDisputeExpiry') {
      transactionTab = 'cases';
      orderApiFilter = 'caseId';
    }

    route = `#transactions/${transactionTab}?${orderApiFilter}=${attrs[orderIdKey]}`;

    if (attrs.expiresIn > 0) {
      // temporarily upping the moment threshold of number of days before month is used,
      // so e,g. 45 is represented as '45 days' instead of '1 month'.
      moment.relativeTimeThreshold('d', 364);

      const timeRemaining = moment(Date.now())
        .from(Date.now() - (attrs.expiresIn * 1000), true);

      text = app.polyglot.t(`notifications.text.${attrs.type}`, {
        orderLink: opts.native ?
          orderIdShort :
          `<a href="${route}" class="clrTEm">${orderIdShort}</a>`,
        timeRemaining,
      });

      text = text.startsWith(timeRemaining) ? capitalize(text) : text;

      // restore the days timeout threshold
      moment.relativeTimeThreshold('d', prevMomentDaysThreshold);
    } else {
      text = app.polyglot.t(`notifications.text.${attrs.type}Expired`, {
        orderLink: opts.native ?
          orderIdShort :
          `<a href="${route}" class="clrTEm">${orderIdShort}</a>`,
      });
    }
  } else if (attrs.type === 'vendorFinalizedPayment') {
    const orderIdShort = `#${attrs.orderId.slice(0, 4)}…`;
    route = `#transactions/purchases?orderId=${attrs.orderId}`;
    text = app.polyglot.t('notifications.text.vendorFinalizedPayment', {
      orderLink: opts.native ?
        orderIdShort :
        `<a href="${route}" class="clrTEm">${orderIdShort}</a>`,
    });
  }

  return {
    text,
    route,
  };
}
