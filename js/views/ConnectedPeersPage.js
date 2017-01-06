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
    this.peersLoaded = 0;
    this.peersIterator = 3;
  }

  className() {
    return 'userPage';
  }

  events() {
    return {
      'click .js-morePeersBtn': 'loadPeers',
    };
  }

  get $peerWrapper() {
    return this._$peerWrapper ||
        (this._$peerWrapper = this.$('.js-peerWrapper'));
  }

  get $morePeers() {
    return this._$morePeers ||
        (this._$morePeers = this.$('.js-morePeers'))
  }

  loadPeers() {
    if (this.peers.length > this.peersLoaded) {
      this.peers.slice(this.peersLoaded, this.peersLoaded + this.peersIterator).forEach((peer) => {
        console.log(peer)
        const user = this.createChild(userShort, {
          guid: peer,
        });
        this.$peerWrapper.append(user.render().$el);
      });
      this.peersLoaded += this.peersIterator;
    }
    
    // check if next set exists
    if (this.peers.length > this.peersLoaded) {
      this.$morePeers.removeClass('hide');
    } else {
      this.$morePeers.addClass('hide');
    }
  }

  render() {
    loadTemplate('connectedPeersPage.html', (t) => {
      this.$el.html(t({
        peers: this.peers,
      }));
    });
    this._$peerWrapper = null;
    this._$morePeers = null;
    this.loadPeers();

    return this;
  }
}
