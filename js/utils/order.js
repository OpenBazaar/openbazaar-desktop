import $ from 'jquery';
import app from '../app';
import { Events } from 'backbone';
import OrderFulfillment from '../models/order/orderFulfillment/OrderFulfillment';
import { openSimpleMessage } from '../views/modals/SimpleMessage';

const events = {
  ...Events,
};

const acceptPosts = {};
const rejectPosts = {};
const cancelPosts = {};
const fulfillPosts = {};
const refundPosts = {};

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

export function fulfillingOrder(orderId) {
  return fulfillPosts[orderId] || false;
}

export function fulfillOrder(contractType = 'PHYSICAL_GOOD', data = {}) {
  if (!data || !data.orderId) {
    throw new Error('An orderId must be provided with the data.');
  }

  const orderId = data.orderId;

  let post = fulfillPosts[orderId];

  if (!post) {
    const model = new OrderFulfillment(data, { contractType });
    post = model.save();

    if (!post) {
      Object.keys(model.validationError)
        .forEach(errorKey => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      post.always(() => {
        delete fulfillPosts[orderId];
      }).done(() => {
        events.trigger('fulfillOrderComplete', {
          id: orderId,
          xhr: post,
        });
      })
      .fail(xhr => {
        events.trigger('fulfillOrderFail', {
          id: orderId,
          xhr: post,
        });

        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedFulfillHeading'),
          failReason
        );
      });

      fulfillPosts[orderId] = post;
    }
  }

  events.trigger('fulfillingOrder', {
    id: orderId,
    xhr: post,
  });

  return post;
}

export function refundingOrder(orderId) {
  return refundPosts[orderId] || false;
}

export function refundOrder(orderId) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  let post = refundPosts[orderId];

  if (!post) {
    post = $.post({
      url: app.getServerUrl('ob/refund'),
      data: JSON.stringify({
        orderId,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      delete refundPosts[orderId];
    }).done(() => {
      events.trigger('refundOrderComplete', {
        id: orderId,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger('refundOrderFail', {
        id: orderId,
        xhr: post,
      });

      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('orderUtil.failedRefundHeading'),
        failReason
      );
    });

    refundPosts[orderId] = post;
  }

  events.trigger('refundingOrder', {
    id: orderId,
    xhr: post,
  });

  return post;
}
