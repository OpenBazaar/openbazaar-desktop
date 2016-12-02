import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';

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

    return this;
  }
}
