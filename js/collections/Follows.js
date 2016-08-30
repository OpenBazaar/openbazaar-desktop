import { Collection } from 'backbone';
import Follow from '../models/Follow';
import app from '../app';


module.exports = Collection.extend({
  /* we have to use the older style for this collection, the ES6 style creates a bug where models
  cannot be removed using their ids */

  initialize: function (models, options) {  // eslint-disable-line object-shorthand
    this.url = app.getServerUrl(options.guid === app.profile.id || !options.guid ?
      `ob/${options.type}` : `ipns/${options.guid}/${options.type}`);
  },

  model: Follow,

  parse: function (response) {   // eslint-disable-line object-shorthand
    response = response.map((guid) => {   // eslint-disable-line no-param-reassign
      // if a plain guid was passed in, convert it to an object
      if (typeof guid === 'string') return { guid };
      return guid;
    });
    return response;
  },
});
