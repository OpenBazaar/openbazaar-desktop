import { guid } from '../../utils';
import { Collection } from 'backbone';
import SocialAccount from '../../models/profile/SocialAccount';

export default class extends Collection {
  model(attrs, options) {
    return new SocialAccount({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
