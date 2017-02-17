import { Collection } from 'backbone';
import Moderator from '../models/profile/Profile';
import app from '../app';
import { getCurrentConnection } from '../utils/serverConnect';


export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
    this.async = options.async;
  }

  url() {
    return app.getServerUrl(`ob/moderators${this.async ? '?async=true' : ''}`);
  }

  model(attrs, options) {
    return new Moderator(attrs, options);
  }

  add(models, options) {
    // remove any returned profiles that are not valid moderators
    const filteredModels = models.filter(mod => mod.moderator && mod.modInfo);
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
          console.log(event);
          // use this.add() here
        });
      } else {
        throw new Error('There is no connection to the server to listen to.');
      }

      return '';
    }

    return response;
  }
}
