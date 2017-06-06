import $ from 'jquery';
import app from '../app';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';

const events = {
  ...Events,
};

const acceptPosts = {};
const rejectPosts = {};
const cancelPosts = {};

function confirmOrder(orderId, reject = false) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  let post = acceptPosts[orderId];

  if (reject) {
    post = rejectPosts[orderId];
  }

  if (!post) {
    post = $.post({
      url: app.getServerUrl('ob/orderconfirmation'),
      data: JSON.stringify({
        orderId,
        reject,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      if (reject) {
        delete rejectPosts[orderId];
      } else {
        delete acceptPosts[orderId];
      }
    }).done(() => {
      events.trigger(`${reject ? 'reject' : 'accept'}OrderComplete`, {
        id: orderId,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger(`${reject ? 'reject' : 'accept'}OrderFail`, {
        id: orderId,
        xhr: post,
      });

      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t(`orderUtil.failed${reject ? 'Reject' : 'Accept'}Heading`),
        failReason
      );
    });

    if (reject) {
      rejectPosts[orderId] = post;
    } else {
      acceptPosts[orderId] = post;
    }
  }

  events.trigger(`${reject ? 'rejecting' : 'accepting'}Order`, {
    id: orderId,
    xhr: post,
  });

  return post;
}

export { events };

export function acceptingOrder(orderId) {
  return acceptPosts[orderId] || false;
}

export function acceptOrder(orderId) {
  return confirmOrder(orderId);
}

export function rejectingOrder(orderId) {
  return rejectPosts[orderId] || false;
}

export function rejectOrder(orderId) {
  return confirmOrder(orderId, true);
}

export function cancelingOrder(orderId) {
  return cancelPosts[orderId] || false;
}

export function cancelOrder(orderId) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  let post = cancelPosts[orderId];

  if (!post) {
    post = $.post({
      url: app.getServerUrl('ob/ordercancel'),
      data: JSON.stringify({
        orderId,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      delete cancelPosts[orderId];
    }).done(() => {
      events.trigger('cancelOrderComplete', {
        id: orderId,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger('cancelOrderFail', {
        id: orderId,
        xhr: post,
      });

      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('orderUtil.failedCancelHeading'),
        failReason
      );
    });

    cancelPosts[orderId] = post;
  }

  events.trigger('cancelingOrder', {
    id: orderId,
    xhr: post,
  });

  return post;
}
