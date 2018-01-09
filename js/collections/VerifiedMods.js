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

  parse(response) {
    const fakeMods = {
      data: {
        name: 'OpenBasketModService',
        description: 'Some description of the moderator verification service that could be any arbitrary length so we had better watch out for that for certain and not let it get too long eh?',
        link: 'url to the provider'
      },
      types: [
        {
          name: 'standard',
          description: 'blah blah blah',
          //badge: 'http://www.pvhc.net/img8/niexjjzstcseuzdzkvoq.png'
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
        }
      ]
    };
    response = fakeMods;
    this.data = response.data;
    this.data.defaultBadge = _.find(response.types, type => type.badge).badge;
    const parsedResponse = response.moderators ? response.moderators : [];
    parsedResponse.forEach((mod) => {
      if (response.types && response.types.length && mod.type) {
        mod.type = _.findWhere(response.types, { name: mod.type });
      }
    });
    return parsedResponse;
  }
}
