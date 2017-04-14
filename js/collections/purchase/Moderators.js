import _ from 'underscore';
import { Collection } from 'backbone';
import Profile from '../../models/profile/Profile';
import app from '../../app';


export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
  }

  model(attrs, options) {
    return new Profile(attrs, options);
  }

  add(models, options) {
    // convert a single model into an array
    let filteredModels = [].concat([], models);

    // remove any returned profiles that are not valid moderators
    if (models) {
      filteredModels = filteredModels.filter((mod) => {
        // don't add if not a mod or the mod data is missing
        return mod.isModerator;
      });
    }
    return super.add(filteredModels, options);
  }
}
