import { Collection } from 'backbone';
import Review from '../../models/listing/Review';


export default class extends Collection {
  constructor(models = [], options = {}) {
    const opts = {
      ...options,
    };
    super(models, opts);
  }

  model(attrs, options) {
    return new Review({
      ...attrs,
    }, options);
  }
}
