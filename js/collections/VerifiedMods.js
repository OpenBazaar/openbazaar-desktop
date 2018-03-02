import _ from 'underscore';
import { Collection } from 'backbone';
import app from '../app';
import Mod from '../models/VerifiedMod';

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
    return app.localSettings.get('verifiedModsProvider');
  }

  get data() {
    return this._data;
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
   * If none of the moderators are verified, return false.
   * @param IDs {array} - a list of IDs
   */
  defaultBadge(IDs) {
    const modelWithBadge = _.find(this.matched(IDs), mod => mod.get('type').badge);
    return !!modelWithBadge && modelWithBadge.get('type').badge;
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
          badge: 'url to the badge image'
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
