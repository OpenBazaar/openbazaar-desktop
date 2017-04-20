import { Collection } from 'backbone';
import UserShort from '../models/UserCard';
import app from '../app';


module.exports = Collection.extend({
  /* we have to use the older style for this collection, the ES6 style creates a bug where models
  cannot be removed using their ids */

  initialize(models, options) {
    if (!options.type) {
      throw new Error('You must provide a type to the collection');
    }

    this.guid = options.guid;
    this.type = options.type;
  },

  url() {
    return app.getServerUrl(this.guid === app.profile.id || !this.guid ?
      `ob/${this.type}` : `ipns/${this.guid}/${this.type}`);
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
