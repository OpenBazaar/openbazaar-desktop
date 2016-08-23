// collection for followers or following

import { Collection } from 'backbone';
import Follow from '../models/Follow';
import app from '../app';
 /*
export default class extends Collection {
  constructor(models, options = {}) {
    super(models, options);
    this.options = options;
    // pass in type, and guid
    this.url = app.getServerUrl(options.guid === app.profile.id || !options.guid ?
      `ob/${options.type}` : `ipns/${options.guid}/${options.type}`);
    // this.url = options.url;
  }

  model(attrs, options) {
    return new Follow(attrs, options);
  }

  parse(response) {
    response = response.map((guid) => {   // eslint-disable-line no-param-reassign
      // if a plain guid was passed in, convert it to an object
      if (typeof guid === 'string') return { guid };
      return guid;
    });
    return response;
  }
}
*/

module.exports = Collection.extend({
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
