import { Collection } from 'backbone';
import Profile from '../models/profile/Profile';


export default class extends Collection {
  model(attrs, options) {
    return new Profile(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerID;
  }
}
