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
   * If no moderator has a badge url, return the default badge url.
   * @param IDs {array} - a list of IDs
   */
  defaultBadge(IDs) {
    const modelWithBadge = _.find(this.matched(IDs), mod => mod.get('type').badge);
    return modelWithBadge && modelWithBadge.get('type').badge ||
      '../imgs/verifiedModeratorBadgeDefault.png';
  }

  parse(response) {
    const fakeMods = {
      data: {
        name: 'OB1 Official Blah Blah',
        description: 'Some description of the moderator verification service that could be any arbitrary length so we had better watch out for that for certain and not let it get too long eh?',
        link: 'http://www.link.com'
      },
      types: [
        {
          name: 'standard',
          description: 'blah blah blah',
          badge: 'http://www.pvhc.net/img8/niexjjzstcseuzdzkvoq.png'
        },
        {
          name: 'advanced',
          description: 'blah blah blah',
          badge: 'https://cdn0.iconfinder.com/data/icons/kameleon-free-pack-rounded/110/Download-Computer-256.png'
        },
      ],
      moderators: [
        {
          peerID: 'QmVFNEj1rv2d3ZqSwhQZW2KT4zsext4cAMsTZRt5dAQqFJ',
          type: 'standard'
        },
        {
          peerID: 'QmXFMkpBBpL4zcYAArVAecLyypFrRzp2Co4q9oXUtzF7XF',
          type: 'advanced'
        },
        {
          peerID: 'QmfGL6dWz8NHwcD9aedL4Y73veqrBQ5Qw7EpQHa3EZ3t4c',
          type: 'advanced'
        },
        {
          peerID: 'QmSxrDKfmZgJmg9bZYsgiCyAZXkPkmvv7qJxMZBQ1WY7eL', // not valid
          type: 'standard'
        }
      ]
    };
    response = fakeMods;
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
        mod.type = _.findWhere(response.types, { name: mod.type });
      }
    });
    return parsedResponse;
  }
}
