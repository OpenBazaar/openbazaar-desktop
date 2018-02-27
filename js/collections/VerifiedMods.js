import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';
import Mod from '../models/VerifiedMod';

export default class extends Collection {
  model(attrs, options) {
    return new Mod(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerID;
  }

  url() {
    return app.localSettings.get('verifiedModsProvider');
  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = data;
  }

  /**
   * Return a list of verified moderators that match the ids passed in
   * @param IDs {array} - a list of IDs
   */
  matched(IDs) {
    return this.filter(mod => IDs.includes(mod.get('peerID')));
  }

  /**
   * Return a badge to use to represent the verified moderators available on a listing.
   * @param IDs {array} - a list of IDs
   */
  defaultBadge(IDs) {
    const modelWithBadge = _.find(this.matched(IDs), mod => mod.get('type').badge);
    return modelWithBadge.get('type').badge;
  }

  parse(response) {
    this.data = response.data;
    this.data.url = this.url(); // backup for templates if the link is missing
    const parsedResponse = response.moderators ? response.moderators : [];
    /*
       Embed the type in each moderator so it's easier to use elsewhere. It should look like:
       peerID: string,
       type: {
         name: string,
         description: string,
         badge: url string,
         }
     */
    parsedResponse.forEach((mod) => {
      if (response.types && response.types.length && mod.type) {
        mod.type = _.findWhere(response.types, { name: mod.type }) || {};
      }
      mod.type.badge = mod.type.badge || '../imgs/verifiedModeratorBadge.png';
    });
    return parsedResponse;
  }
}
