import app from '../../app';
import * as block from '../../utils/block';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import { recordEvent } from '../../utils/metrics';

export default class extends baseVw {
  constructor(options = {}) {
    if (typeof options.targetId !== 'string') {
      throw new Error('Please provide a targetId as a string.');
    }

    if (app.profile.id === options.targetId) {
      throw new Error('Blocking is not available on your own node.');
    }

    const opts = {
      ...options,
      initialState: {
        useIcon: false,
        tooltipClass: options.initialState && options.initialState.useIcon ?
          'toolTipNoWrap toolTipTop' : '',
        isBlocking: block.isBlocking(options.targetId) ||
          block.isUnblocking(options.targetId),
        isBlocked: block.isBlocked(options.targetId),
        ...(options && options.initialState || {}),
      },
    };

    super(opts);
    this.targetId = options.targetId;

    this.listenTo(block.events, 'unblocking blocking', data => {
      if (!data.peerIds.includes(options.targetId)) return;
      this.setState({ isBlocking: true });
    });

    this.listenTo(block.events, 'blocked unblocked blockFail unblockFail',
      data => {
        if (!data.peerIds.includes(options.targetId)) return;
        this.setState({ isBlocking: false });
      });

    this.listenTo(block.events, 'blocked', data => {
      if (!data.peerIds.includes(options.targetId)) return;
      this.setState({ isBlocked: true });
    });

    this.listenTo(block.events, 'unblocked', data => {
      if (!data.peerIds.includes(options.targetId)) return;
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
      block.unblock(this.targetId);
      recordEvent('UnBlockUser');
    } else {
      block.block(this.targetId);
      recordEvent('BlockUser');
    }
  }


  render() {
    loadTemplate('components/blockBtn.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
