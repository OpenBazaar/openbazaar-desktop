import { Collection } from 'backbone';
import Option from '../../models/purchase/Option';

export default class extends Collection {
  model(attrs, options) {
    return new Option(attrs, options);
  }
}
