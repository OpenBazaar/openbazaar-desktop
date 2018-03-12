import $ from 'jquery';
import app from '../app';
import { Events } from 'backbone';
import OrderFulfillment from '../models/order/orderFulfillment/OrderFulfillment';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import OrderCompletion from '../models/order/orderCompletion/OrderCompletion';
import OrderDispute from '../models/order/OrderDispute';
import ResolveDispute from '../models/order/ResolveDispute';

const events = {
  ...Events,
};

const acceptPosts = {};
const rejectPosts = {};
const cancelPosts = {};
const fulfillPosts = {};
const refundPosts = {};
const completePosts = {};
const openDisputePosts = {};
const resolvePosts = {};
const acceptPayoutPosts = {};
const releaseEscrowPosts = {};

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

    events.trigger(`${reject ? 'rejecting' : 'accepting'}Order`, {
      id: orderId,
      xhr: post,
    });
  }

  return post;
}

export { events };

export function acceptingOrder(orderId) {
  return !!acceptPosts[orderId];
}

export function acceptOrder(orderId) {
  return confirmOrder(orderId);
}

export function rejectingOrder(orderId) {
  return !!rejectPosts[orderId];
}

export function rejectOrder(orderId) {
  return confirmOrder(orderId, true);
}

export function cancelingOrder(orderId) {
  return !!cancelPosts[orderId];
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
    events.trigger('cancelingOrder', {
      id: orderId,
      xhr: post,
    });
  }

  return post;
}

export function fulfillingOrder(orderId) {
  return !!fulfillPosts[orderId];
}

export function fulfillOrder(contractType = 'PHYSICAL_GOOD', isLocalPickup = false, data = {}) {
  if (!data || !data.orderId) {
    throw new Error('An orderId must be provided with the data.');
  }

  const orderId = data.orderId;

  let post = fulfillPosts[orderId];

  if (!post) {
    const model = new OrderFulfillment(data, { contractType, isLocalPickup });
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
      events.trigger('fulfillingOrder', {
        id: orderId,
        xhr: post,
      });
    }
  }

  return post;
}

export function refundingOrder(orderId) {
  return !!refundPosts[orderId];
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
    events.trigger('refundingOrder', {
      id: orderId,
      xhr: post,
    });
  }

  return post;
}

/**
 * If the order with the given id is in the process of being completed, this method
 * will return an object containing the post xhr and the data that's being saved.
 */
export function completingOrder(orderId) {
  return !!completePosts[orderId];
}

export function completeOrder(orderId, data = {}) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  if (!completePosts[orderId]) {
    const model = new OrderCompletion(data);
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach(errorKey => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete completePosts[orderId];
      }).done(() => {
        events.trigger('completeOrderComplete', {
          id: orderId,
          xhr: save,
        });
      })
      .fail(xhr => {
        events.trigger('completeOrderFail', {
          id: orderId,
          xhr: save,
        });

        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedCompleteHeading'),
          failReason
        );
      });

      completePosts[orderId] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('completingOrder', {
      id: orderId,
      xhr: save,
    });
  }

  return completePosts[orderId].xhr;
}

/**
 * If the order with the given id is in the process of a dispute being opened,
 * this method will return an object containing the post xhr and the data
 * that's being saved.
 */
export function openingDispute(orderId) {
  return !!openDisputePosts[orderId];
}

export function openDispute(orderId, data = {}) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  if (!openDisputePosts[orderId]) {
    const model = new OrderDispute(data);
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach(errorKey => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete openDisputePosts[orderId];
      }).done(() => {
        events.trigger('openDisputeComplete', {
          id: orderId,
          xhr: save,
        });
      })
      .fail(xhr => {
        events.trigger('openDisputeFail', {
          id: orderId,
          xhr: save,
        });

        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedOpenDisputeHeading'),
          failReason
        );
      });

      openDisputePosts[orderId] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('openingDisputeOrder', {
      id: orderId,
      xhr: save,
    });
  }

  return openDisputePosts[orderId].xhr;
}

/**
 * If the order with the given id is in the process of its dispute being resolved,
 * this method will return an object containing the post xhr and the data that's
 * being saved.
 */
export function resolvingDispute(orderId) {
  return !!resolvePosts[orderId];
}

export function resolveDispute(model) {
  if (!(model instanceof ResolveDispute)) {
    throw new Error('model must be provided as an instance of a ResolveDispute model.');
  }

  if (!model.id) {
    throw new Error('The model must have an id set.');
  }

  const orderId = model.id;

  if (!resolvePosts[orderId]) {
    const save = model.save();

    if (!save) {
      Object.keys(model.validationError)
        .forEach(errorKey => {
          throw new Error(`${errorKey}: ${model.validationError[errorKey][0]}`);
        });
    } else {
      save.always(() => {
        delete resolvePosts[orderId];
      }).done(() => {
        events.trigger('resolveDisputeComplete', {
          id: orderId,
          xhr: save,
        });
      })
      .fail(xhr => {
        events.trigger('resolveDisputeFail', {
          id: orderId,
          xhr: save,
        });

        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('orderUtil.failedResolveHeading'),
          failReason
        );
      });

      resolvePosts[orderId] = {
        xhr: save,
        data: model.toJSON(),
      };
    }

    events.trigger('resolvingDispute', {
      id: orderId,
      xhr: save,
    });
  }

  return resolvePosts[orderId].xhr;
}

export function acceptingPayout(orderId) {
  return !!acceptPayoutPosts[orderId];
}

export function acceptPayout(orderId) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  let post = acceptPayoutPosts[orderId];

  if (!post) {
    post = $.post({
      url: app.getServerUrl('ob/releasefunds'),
      data: JSON.stringify({
        orderId,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      delete acceptPayoutPosts[orderId];
    }).done(() => {
      events.trigger('acceptPayoutComplete', {
        id: orderId,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger('acceptPayoutFail', {
        id: orderId,
        xhr: post,
      });

      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('orderUtil.failedAcceptPayoutHeading'),
        failReason
      );
    });

    acceptPayoutPosts[orderId] = post;
    events.trigger('acceptingPayout', {
      id: orderId,
      xhr: post,
    });
  }

  return post;
}

export function releasingEscrow(orderId) {
  return !!releaseEscrowPosts[orderId];
}

export function releaseEscrow(orderId) {
  if (!orderId) {
    throw new Error('Please provide an orderId');
  }

  let post = releaseEscrowPosts[orderId];

  if (!post) {
    post = $.post({
      url: app.getServerUrl('ob/releaseescrow'),
      data: JSON.stringify({
        orderId,
      }),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      delete releaseEscrowPosts[orderId];
    }).done(() => {
      events.trigger('releaseEscrowComplete', {
        id: orderId,
        xhr: post,
      });
    })
    .fail(xhr => {
      events.trigger('releaseEscrowFail', {
        id: orderId,
        xhr: post,
      });

      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('orderUtil.failedReleaseEscrowHeading'),
        failReason
      );
    });

    releaseEscrowPosts[orderId] = post;
    events.trigger('releasingEscrow', {
      id: orderId,
      xhr: post,
    });
  }

  return post;
}
