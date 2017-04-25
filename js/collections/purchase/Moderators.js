import { Collection } from 'backbone';
import Profile from '../../models/profile/Profile';


export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
  }

  model(attrs, options) {
    return new Profile(attrs, options);
  }
}
