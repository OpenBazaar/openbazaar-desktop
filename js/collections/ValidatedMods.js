import { Collection } from 'backbone';
import app from '../app';
import Mod from '../models/ValidatedMod';

export default class extends Collection {
  model(attrs, options) {
    return new Mod(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerId;
  }

  url() {
    return app.localSettings.get('validatedModsProvider');
  }

  get types() {
    return this._types;
  }

  set types(types) {
    this._types = types;
  }

  parse(response) {
    // handle just an array of moderators, or a more complext response
    const parsedResponse = response.moderators || Array.isArray(response) ? response : [];
    this.types = response.types || [];
    if (response.data) {
      this.name = response.data.name;
      this.description = response.data.description;
      this.link = response.data.link;
    }
    return parsedResponse;
  }
}
