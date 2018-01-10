import app from '../../app';
import * as block from '../../utils/block';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (typeof options.peerId !== 'string') {
      throw new Error('Please provide a peerId as a string.');
    }

    if (app.profile.id === options.peerId) {
      throw new Error('Blocking is not available on your own node.');
    }

    const opts = {
      initialState: {
        tooltipClass: 'toolTipNoWrap toolTipTop',
        isBlocking: block.isBlocking(options.peerId) ||
          block.isUnblocking(options.peerId),
        isBlocked: block.isBlocked(options.peerId),
        ...(options && options.initialState || {}),
      },
      ...options,
    };

    super(opts);
    this.peerId = options.peerId;

    this.listenTo(block.events, 'unblocking blocking', data => {
      if (!data.peerIds.includes(options.peerId)) return;
      this.setState({ isBlocking: true });
    });

    this.listenTo(block.events, 'blocked unblocked blockFail unblockFail',
      data => {
        if (!data.peerIds.includes(options.peerId)) return;
        this.setState({ isBlocking: false });
      });

    this.listenTo(block.events, 'blocked', data => {
      if (!data.peerIds.includes(options.peerId)) return;
      this.setState({ isBlocked: true });
    });

    this.listenTo(block.events, 'unblocked', data => {
      if (!data.peerIds.includes(options.peerId)) return;
      this.setState({ isBlocked: false });
    });
  }

  events() {
    return {
      'click .js-block': 'onClickBlock',
    };
  }

  onClickBlock(e) {
    e.stopPropagation();

    if (this.getState().isBlocked) {
      block.unblock(this.peerId);
    } else {
      block.block(this.peerId);
    }
  }


  render() {
    loadTemplate('components/blockIconBtn.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
