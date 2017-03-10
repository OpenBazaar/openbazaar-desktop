import _ from 'underscore';
import { Collection } from 'backbone';
import Moderator from '../models/profile/Profile';
import app from '../app';
import { getCurrentConnection } from '../utils/serverConnect';


export default class extends Collection {
  constructor(models = [], options = {}) {
    const opts = {
      // set defaults
      apiPath: 'moderators',
      async: false,
      // defaults will be overwritten by passed in options
      ...options,
      includeString: options.include ? `&include=${options.include}` : '',
    };

    super(models, opts);

    this.options = opts;

    this.notFetchedYet = [];
  }

  url() {
    const op = this.options;
    return app.getServerUrl(`ob/${op.apiPath}?async=${op.async}${op.includeString}`);
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
    // if an excluded collection was passed into the options, don't add any moderators in it
    const excludeList = this.options.excludeCollection ?
        _.pluck(this.options.excludeCollection.models, 'id') : [];
    let modIDs = [];
    // remove any returned profiles that are not valid moderators
    if (models) {
      filteredModels = filteredModels.filter((mod) => {
        // don't add excluded ids or your own id
        const notExcluded = excludeList.indexOf(mod.id) === -1 && mod.id !== app.profile.id;
        // don't add if not a mod or the mod data is missing
        return mod.isModerator && notExcluded;
      });
      modIDs = _.pluck(filteredModels, 'id');

      this.notFetchedYet = _.without(this.notFetchedYet, ...modIDs);
    }
    return super.add(filteredModels, options);
  }

  parse(response) {
    if (this.options.async) {
      // if the fetch is async, don't parse the results, they don't have model data
      this.socketID = response.id;
      // start listening to the web socket using the returned id
      const serverConnection = getCurrentConnection();
      if (serverConnection && serverConnection.status !== 'disconnected') {
        this.listenTo(serverConnection.socket, 'message', (event) => {
          const data = event.jsonData;
          if (data.id === this.socketID) {
            if (data.error || !data.profile) {
              // don't add the results if there is an error or the profile is missing
              this.trigger('asyncError', { id: data.peerId, error: data.error });
              // remove errored id from the not fetched list
              this.notFetchedYet = this.notFetchedYet.filter(id => id !== data.peerId);
            } else {
              data.profile.id = data.peerId;
              const mod = new Moderator(data.profile, { parse: true });
              this.add(mod);
            }
          }
        });
      } else {
        throw new Error('There is no connection to the server to listen to.');
      }

      return '';
    }
    // return only the profile so it matches the data expected by the Profile model
    const formattedResponse = response.map((mod) => {
      const mappedProfile = mod.profile;
      mappedProfile.id = mod.peerId;
      return mappedProfile;
    });

    // clear the not fetched list on POST return
    this.notFetchedYet = [];

    return formattedResponse;
  }

  destroy() {
    // unbind the listener to the server connection so the collection can be garbage collected
    this.stopListening();
  }
}
