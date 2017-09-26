import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import app from '../../../app';
import Moderators from '../../../collections/purchase/Moderators';
import { getSocket } from '../../../utils/serverConnect';
import { openSimpleMessage } from '../SimpleMessage';
import ModCard from '../../ModeratorCard';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.fetchErrorTitle || !options.fetchErrorMsg) {
      throw new Error('Please provide error text for the moderator fetch.');
    }
    if (!options.cardState) {
      throw new Error('Please provide a default card state.');
    }
    if (!options.notSelected) {
      throw new Error('Please provide a default not selected state.');
    }
    const opts = {
      // set defaults
      apiPath: 'fetchprofiles',
      async: true,
      useCache: true,
      moderatorIDs: [],
      method: 'POST',
      include: '',
      purchase: false,
      singleSelect: false,
      selectFirst: false,
      radioStyle: false,
      // defaults will be overwritten by passed in options
      ...options,
    };

    if (opts.apiPath === 'moderators' && opts.moderatorIDs.length) {
      throw new Error('If you provide a list of IDs, the path should not be moderators.');
    }

    if (opts.apiPath === 'moderators') {
      // this will fetch available moderators without POSTing a list of IDs.
      opts.include = 'profile';
      opts.method = 'GET';
    }

    super(opts);
    this.options = opts;
    this.moderatorsCol = new Moderators();
    this.listenTo(this.moderatorsCol, 'add', (model, collection, colOpts) => {
      this.addMod(model, collection, colOpts);
    });
    this.modCards = [];
  }

  className() {
    return 'moderatorsList';
  }

  getModeratorsByID(IDs = this.options.moderatorIDs) {
    const op = this.options;
    const includeString = op.include ? `&include=${op.include}` : '';
    const urlString =
      `ob/${op.apiPath}?async=${op.async}${includeString}&usecache=${op.useCache}`;
    const url = app.getServerUrl(urlString);

    if (this.fetch && this.fetch.state() === 'pending') return;

    this.notFetchedYet = IDs;
    this.fetchingMods = IDs;
    if (IDs.length) {
      this.$moderatorsStatus.removeClass('hide');
      this.$moderatorStatusText.text(app.polyglot.t('moderators.moderatorsLoading',
          { remaining: IDs.length, total: IDs.length }));
    }

    // Either a list of IDs can be posted, or any available moderators can be retrieved with GET
    if (IDs.length || this.options.method === 'GET') {
      this.$moderatorsWrapper.addClass('processing');
      this.fetch = $.ajax({
        url,
        data: JSON.stringify(IDs),
        method: this.options.method,
      })
          .done((data) => {
            if (op.async) {
              const socketID = data.id;
              // listen to the websocket for moderator data
              const serverSocket = getSocket();
              if (serverSocket) {
                this.listenTo(serverSocket, 'message', (event) => {
                  const eventData = event.jsonData;
                  if (eventData.error) {
                    // errors don't have a message id, check to see if the peerID matches
                    if (this.options.moderatorIDs.indexOf(eventData.peerId) !== -1) {
                      // don't add errored moderators
                      this.removeNotFetched(eventData.peerId);
                    }
                  } else if (eventData.id === socketID) {
                    // don't add profiles that are not moderators. The ID list may have peerIDs
                    // that are out of date, and are no longer moderators.
                    if (eventData.profile.moderator && eventData.profile.moderatorInfo) {
                      // if the moderator has an invalid currency, remove them from the list
                      const buyerCur = app.serverConfig.cryptoCurrency;
                      const modCurs = eventData.profile.moderatorInfo.acceptedCurrencies;
                      const validCur = modCurs.indexOf(buyerCur) > -1;
                      if (validCur) {
                        this.moderatorsCol.add(eventData.profile);
                      } else {
                        // remove the invalid moderator from the notFetched list
                        this.removeNotFetched(eventData.peerId);
                      }
                    } else {
                      // remove the invalid moderator from the notFetched list
                      this.removeNotFetched(eventData.peerId);
                    }
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
          })
          .fail((xhr) => {
            if (xhr.statusText === 'abort') return;
            const failReason = xhr.responseJSON ? `\n\n${xhr.responseJSON.reason}` : '';
            const msg = `${this.options.fetchErrorMsg}${failReason}`;
            openSimpleMessage(this.options.fetchErrorTitle, msg);
            this.$moderatorsWrapper.removeClass('processing');
          });
    }
  }

  removeNotFetched(ID) {
    this.notFetchedYet = this.notFetchedYet.filter(peerID => peerID !== ID);
    this.checkNotFetched();
  }

  checkNotFetched() {
    const nfYet = this.notFetchedYet.length;
    // if at least one mod has loaded, remove the spinner
    if (nfYet < this.fetchingMods.length) {
      this.$moderatorsWrapper.removeClass('processing');
    }
    if (nfYet === 0) {
      // all ids have been fetced
      this.$moderatorsStatus.addClass('hide');
      this.$moderatorStatusText.text('');
      // check if none of the loaded moderators are valid
      if (!this.moderatorsCol.length) {
        this.trigger('noValidModerators');
      }
    } else {
      this.$moderatorStatusText.text(app.polyglot.t('moderators.moderatorsLoading',
          { remaining: nfYet, total: this.fetchingMods.length }));
    }
  }

  addMod(model, collection, opts) {
    if (model) {
      const cardState = this.options.cardState;
      const newModView = this.createChild(ModCard, {
        model,
        purchase: this.options.purchase,
        notSelected: this.options.notSelected,
        cardState,
        radioStyle: this.options.radioStyle,
        ...opts,
      });
      this.listenTo(newModView, 'changeModerator', (data) => {
        // if only one moderator should be selected, deselect the other moderators
        if (this.options.singleSelect && data.selected) this.deselectOthers(data.guid);
      });
      this.$moderatorsWrapper.append(newModView.render().$el);
      this.removeNotFetched(model.id);
      this.modCards.push(newModView);
      // if required, select the first  moderator
      if (this.options.selectFirst && !this.firstSelected && !this.noneSelected) {
        this.firstSelected = true;
        newModView.changeSelectState('selected');
      }
    }
  }

  get selectedIDs() {
    const IDs = [];
    this.modCards.forEach((mod) => {
      if (mod.cardState === 'selected') {
        IDs.push(mod.model.id);
      }
    });
    return IDs;
  }

  deselectOthers(guid = '') {
    this.modCards.forEach((mod) => {
      if (mod.model.get('peerID') !== guid) {
        mod.changeSelectState(this.options.notSelected);
      }
    });
  }

  get noneSelected() {
    return this._noneSelected;
  }

  set noneSelected(bool) {
    this._noneSelected = bool;
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
      this.$moderatorsWrapper = this.$('.js-moderatorsWrapper');
      this.$moderatorsStatus = this.$('.js-moderatorsStatus');
      this.$moderatorStatusText = this.$('.js-moderatorStatusInner');
    });

    return this;
  }
}
