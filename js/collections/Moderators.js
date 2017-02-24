import _ from 'underscore';
import { Collection } from 'backbone';
import Moderator from '../models/profile/Profile';
import app from '../app';
import { getCurrentConnection } from '../utils/serverConnect';


export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.type = options.type || 'moderators';
    this.async = options.async || false;
    this.include = options.include || false;
    this.excludeList = options.excludeList || [];
  }

  url() {
    return app.getServerUrl(`ob/${this.type}?async=${this.async}&include=${this.include}`);
  }

  model(attrs, options) {
    return new Moderator(attrs, options);
  }

  add(models, options) {
    let filteredModels = models;

    // remove any returned profiles that are not valid moderators
    if (models) {
      // is models an array or just one model?
      if (_.isArray(models)) {
        filteredModels = filteredModels.filter((mod) => {
          // don't add excluded ids
          const notExcluded = this.excludeList.indexOf(mod.id) === -1;
          // don't add if not a mod or the mod data is missing
          return mod.moderator && mod.modInfo && notExcluded;
        });
      } else if (!filteredModels.get('moderator') || !filteredModels.get('modInfo') ||
          this.excludeList.indexOf(filteredModels.id) !== -1) {
        return false;
      }
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
            const profile = data.profile;
            profile.id = data.peerId;
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
