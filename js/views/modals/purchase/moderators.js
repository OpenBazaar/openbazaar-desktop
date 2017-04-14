import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import app from '../../../app';
import Moderators from '../../../collections/purchase/Moderators';
import { getCurrentConnection } from '../../../utils/serverConnect';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      // set defaults
      apiPath: 'fetchprofiles',
      async: true,
      moderatorIDs: [],
      include: '',
      // defaults will be overwritten by passed in options
      ...options,
    };

    if (opts.apiPath === 'moderators') {
      // this will fetch available moderators
      opts.include = 'profile';
    }

    super(opts);
    this.options = opts;
    this.moderatorsCol = new Moderators();
    this.notFetchedYet = this.options.moderatorIDs;
    this.fetching = false;
  }

  className() {
    return 'moderators';
  }

  getModeratorsByID(IDs = this.options.moderatorIDs) {
    const op = this.options;
    const includeString = op.include ? `&include=${op.include}` : '';
    const url = app.getServerUrl(`ob/${op.apiPath}?async=${op.async}${includeString}`);

    if (IDs.length) {
      this.fetching = true;
      this.fetch = $.post({
        url,
        data: JSON.stringify(IDs),
      })
          .done((data) => {
            if (op.async) {
              const socketID = data.id;
              // listen to the websocket for moderator data
              const serverConnection = getCurrentConnection();
              if (serverConnection && serverConnection.status !== 'disconnected') {
                this.listenTo(serverConnection.socket, 'message', (event) => {
                  const eventData = event.jsonData;
                  if (eventData.error) {
                    // errors don't have a message id, check to see if the peerID matches
                    this.peerIDError(eventData.peerId, eventData.error);
                  } else if (eventData.id === socketID) {
                    // make sure it's a valid moderator
                    eventData.profile.id = eventData.peerId;
                    this.moderatorsCol.add(eventData.profile);
                  }
                });
              } else {
                throw new Error('There is no connection to the server to listen to.');
              }
            } else {
              const formattedMods = data.map((mod) => {
                const mappedProfile = mod.profile;
                mappedProfile.id = mod.peerId;
                return mappedProfile;
              });
              this.moderatorsCol.add(formattedMods);
              this.notFetchedYet = [];
              this.checkNotFetched();
            }
          });
    }
  }

  peerIDError(ID, error) {
    if (this.options.moderatorIDs.indexOf(ID) !== -1) {
      console.log(ID)
      console.log(error)
      this.removeNotFetched(ID);
    }
  }

  removeNotFetched(ID) {
    this.notFetchedYet = this.notFetchedYet.filter(peerID => peerID !== ID);
    this.checkNotFetched();
  }

  checkNotFetched() {
    if (this.notFetchedYet.length < 1) {
      // all ids have been fetced
      this.fetching = false;
    }
  }

  fetchAddress() {
    if (this.receiveMoney) {
      this.receiveMoney.setState({
        fetching: true,
      });
    }

    this.needAddressFetch = false;

    let address = '';

    const fetch = $.get(app.getServerUrl('wallet/address/'))
        .done((data) => {
          address = data.address;
        }).always(() => {
          if (this.isRemoved()) return;

          if (this.receiveMoney && !this.isAdressFetching()) {
            this.receiveMoney.setState({
              fetching: false,
              address,
            });
          }
        });

    this.addressFetches.push(fetch);

    return fetch;
  }

  remove() {
    if (this.fetch) this.fetch.abort();
    super.remove();
  }

  render() {
    loadTemplate('modals/purchase/moderators.html', t => {
      this.$el.html(t({
      }));

      super.render();
    });

    return this;
  }
}
