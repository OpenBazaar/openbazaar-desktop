import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';
import Mod from '../models/VerifiedMod';
import { getCurrentConnection } from '../utils/serverConnect';

export default class extends Collection {
  constructor(...args) {
    super(...args);
    this._data = {};
  }

  model(attrs, options) {
    return new Mod(attrs, options);
  }

  modelId(attrs) {
    return attrs.peerID;
  }

  url() {
    const usingTor = getCurrentConnection().server.get('useTor');
    return app.localSettings.get(`verifiedModsProvider${usingTor ? 'Tor' : ''}`);
  }

  get data() {
    return this._data;
  }

  get localBadge() {
    return {
      large: '../imgs/verifiedModeratorBadge-large.png',
      medium: '../imgs/verifiedModeratorBadge-medium.png',
      small: '../imgs/verifiedModeratorBadge-small.png',
      tiny: '../imgs/verifiedModeratorBadge-tiny.png',
    };
  }

  /**
   * Return a list of verified moderators that match the ids passed in
   * @param IDs {array} - a list of IDs
   */
  matched(IDs = []) {
    return this.filter(mod => IDs.includes(mod.get('peerID')));
  }

  /**
   * Return a badge object to use to represent the verified moderators available on a listing.
   * If none of the moderators have a badge value, return the local badge files.
   * @param IDs {array} - a list of IDs
   */
  defaultBadge(IDs) {
    const modelWithBadge = _.find(this.matched(IDs), mod => mod.get('type').badge);
    return {
      ...this.localBadge,
      ...(modelWithBadge && modelWithBadge.get('type').badge || {}),
    };
  }

  parse(response) {
    /* The data is expected to be delivered in the following format. There must be at least one
       type with a badge, or the grey loading badge will be shown instead.
    {
      data: {
        name: 'name of provider (required)',
        description: 'description of the provider (optional)',
        link: 'url to the provider (required)'
      },
      types: [
        {
          name: 'standard (required)',
          description: 'description of this type of moderator (optional)',
          badge: {
            large: "url",
            medium: "url",
            small: "url",
            tiny: "url"
          }
        }
      ],
      moderators: [
        {
          peerID: 'QmVFNEj1rv2d3ZqSwhQZW2KT4zsext4cAMsTZRt5dAQqFJ',
          type: 'standard'
        }
      ]
    }
     */
    this._data = response.data || {};
    this._data.url = this.url(); // backup for templates if the link is missing
    const parsedMods = response.moderators ? response.moderators : [];
    /*
       Embed the type in each moderator so it's easier to use elsewhere. It should look like:
       peerID: string,
       type: {
         name: string,
         description: string,
         badge: url string,
         }
     */
    const parsedResponse = [];
    parsedMods.forEach((mod) => {
      if (response.types && response.types.length && mod.type) {
        mod.type = _.findWhere(response.types, { name: mod.type });
        if (mod.type) parsedResponse.push(mod);
      }
    });
    return parsedResponse;
  }
}
