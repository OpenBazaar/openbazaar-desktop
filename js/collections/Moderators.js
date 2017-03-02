import _ from 'underscore';
import { Collection } from 'backbone';
import Moderator from '../models/profile/Profile';
import app from '../app';
import { getCurrentConnection } from '../utils/serverConnect';


export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.apiPath = options.apiPath || 'moderators';
    this.async = !!options.async;
    this.includeString = options.include ? `&include=${options.include}` : '';
    this.excludeCollection = options.excludeCollection || [];
    this.notFetchedYet = [];
  }

  url() {
    return app.getServerUrl(`ob/${this.apiPath}?async=${this.async}${this.includeString}`);
  }

  model(attrs, options) {
    return new Moderator(attrs, options);
  }

  fetch(options = {}) {
    // if a list of guids to fetch was passed in, post them to the server
    if (options.fetchList && options.fetchList.length) {
      // save the list so the view can determine if the fetch is complete
      this.notFetchedYet = options.fetchList;
      options.data = JSON.stringify(options.fetchList);
      options.type = 'POST';
    }
    return super.fetch(options);
  }

  add(models, options) {
    let filteredModels = _.isArray(models) ? models : [models];
    const excludeList = _.pluck(this.excludeCollection.models, 'id');
    let modIDs = [];
    // remove any returned profiles that are not valid moderators
    if (models) {
      filteredModels = filteredModels.filter((mod) => {
        // don't add excluded ids
        const notExcluded = excludeList.indexOf(mod.id) === -1;
        // don't add if not a mod or the mod data is missing
        return mod.moderator && mod.modInfo && notExcluded;
      });
      modIDs = _.pluck(filteredModels, 'id');

      this.notFetchedYet = _.without(this.notFetchedYet, ...modIDs);
    }
    return super.add(filteredModels, options);
  }

  parse(response) {
    if (this.async) {
      // if the fetch is async, don't parse the results, they don't have model data
      this.socketID = response.id;
      // start listening to the web socket using the returned id
      const serverConnection = getCurrentConnection();
      if (serverConnection && serverConnection.status !== 'disconnected') {
        this.listenTo(serverConnection.socket, 'message', (event) => {
          const data = JSON.parse(event.data);
          if (data.id === this.socketID) {
            data.profile.id = data.peerId;
            this.add([data.profile]);
          }
        });
      } else {
        throw new Error('There is no connection to the server to listen to.');
      }

      return '';
    }

    return response;
  }
}
