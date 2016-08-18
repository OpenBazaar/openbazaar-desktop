// collection for followers or following

import { Collection } from 'backbone';
import Follow from '../models/Follow';

export default class extends Collection {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.url = options.url;
  }

  model(attrs, options) {
    return new Follow(attrs, options);
  }
}
