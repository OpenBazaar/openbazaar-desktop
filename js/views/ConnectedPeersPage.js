import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import userShort from './userShort';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!options.peers) {
      throw new Error('Please provide a list of peers');
    }

    this.peers = options.peers;
  }

  render() {
    loadTemplate('connectedPeersPage.html', (t) => {
      this.$el.html(t({
        peers: this.peers,
      }));
    });
    
    const peerWrapper = this.$('.js-peerWrapper');

    if (this.peers.length) {
      this.peers.forEach((peer) => {
        const user = this.createChild(userShort, {
          guid: peer,
        });
        peerWrapper.append(user.render().$el);
      });
    }

    return this;
  }
}
