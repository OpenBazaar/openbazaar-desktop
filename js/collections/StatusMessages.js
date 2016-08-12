import { Collection } from 'backbone';
import StatusMessage from '../models/StatusMessage';

export default class extends Collection {
  model(attrs, options) {
    return new StatusMessage(attrs, options);
  }
}
