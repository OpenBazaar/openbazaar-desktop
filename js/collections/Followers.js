import { Collection } from 'backbone';
import UserShort from '../models/UserShort';
import app from '../app';


module.exports = Collection.extend({
  /* we have to use the older style for this collection, the ES6 style creates a bug where models
  cannot be removed using their ids */

  initialize(models, options = {}) {
    this.guid = options.guid;
    this.type = options.type;
  },

  url() {
    let url;
    // if a type is provided, fetch a collection of users
    if (this.type) {
      url = app.getServerUrl(this.guid === app.profile.id || !this.guid ?
        `ob/${this.type}` : `ipns/${this.guid}/${this.type}`);
    }

    return url;
  },

  model: UserShort,

  parse(response) {
    return response.map((guid) => {
      // if a plain guid was passed in, convert it to an object
      if (typeof guid === 'string') return { guid };
      return guid;
    });
  },
});
