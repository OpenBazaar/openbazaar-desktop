import app from '../app';
import { Collection } from 'backbone';
import Follower from '../models/Follower';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);

    const types = ['followers', 'following'];
    if (types.indexOf(options.type) === -1) {
      throw new Error(`Please provide a type as one of ${types.join(', ')}`);
    }

    if (!options.peerId) {
      throw new Error('Please provide a peerId');
    }

    this.options = options;
  }

  model(attrs, options) {
    return new Follower(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerId;
  }

  url() {
    return app.getServerUrl(`ob/${this.options.type === 'followers' ? 'followers' : 'following'}` +
      `${app.profile.id === this.options.peerId ? '' : `/${this.options.peerId}`}`);
  }

  parse(response) {
    return response.map(peerId => ({ peerId }));
  }
}
