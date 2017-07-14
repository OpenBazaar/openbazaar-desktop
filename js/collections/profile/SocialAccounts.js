import { Collection } from 'backbone';
import SocialAccount from '../../models/profile/SocialAccount';

export default class extends Collection {
  model(attrs, options) {
    return new SocialAccount(attrs, options);
  }
}
