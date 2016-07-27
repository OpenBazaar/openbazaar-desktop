import { Collection } from 'backbone';
import SocialAccount from '../models/SocialAccount';

export default class extends Collection {
  model(attrs, options) {
    return new SocialAccount(attrs, options);
  }
}
