// collection for followers or following

import { Collection } from 'backbone';
import Follow from '../models/Follow';

export default class extends Collection {
  constructor(models, options = {}) {
    super(options);
    this.options = options;
    this.url = options.url;
  }

  model(attrs, options) {
    return new Follow(attrs, options);
  }

  parse(response) {
    response = response.map((guid) => {   // eslint-disable-line no-param-reassign
      // if a plain guid was passed in, convert it to an object
      if (typeof guid === 'string') return { guid };
      return guid;
    });
    return response;
  }
}
