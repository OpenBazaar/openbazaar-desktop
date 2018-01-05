import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { unblock, block, events as blockEvents } from '../../../utils/block';

export default class extends baseVw {
  constructor(options = {}) {
    super();

    blockEvents.on('blocking unblocking', data => {
      data.peerIds.forEach(peerId => {
        this.$el.find(`[data-peerid=${peerId}] button`)
          .css('color', 'red');
      });
    });

    blockEvents.on('blockFail unblockFail', data => {
      data.peerIds.forEach(peerId => {
        this.$el.find(`[data-peerid=${peerId}] button`)
          .css('color', 'black');
      });
    });

    blockEvents.on('blocked', data => {
      data.peerIds.forEach(peerId => {
        this.$el.find(`[data-peerid=${peerId}] button`)
          .text('unblock')
          .css('color', 'black');
      });
    });

    blockEvents.on('unblocked', data => {
      data.peerIds.forEach(peerId => {
        this.$el.find(`[data-peerid=${peerId}] button`)
          .text('block')
          .css('color', 'black');
      });
    });
  }

  events() {
    return {
      'click .js-unblock': 'onClickUnblock',
    };
  }

  onClickUnblock(e) {
    const $peerIdEl = $(e.target).closest('[data-peerid]', this.el);
    const peerId = $peerIdEl.attr('data-peerid');

    if (!peerId) {
      throw new Error('Unable to unblock because the peerId data attribute is not set.');
    }

    if (app.settings.get('blockedNodes').includes(peerId)) {
      unblock(peerId);
    } else {
      block(peerId);
    }
  }

  render() {
    super.render();
    loadTemplate('modals/settings/blocked.html', (t) => {
      this.$el.html(t({
        blocked: app.settings.get('blockedNodes'),
      }));
    });

    return this;
  }
}
