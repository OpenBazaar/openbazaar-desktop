import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { getSocket } from '../../utils/serverConnect';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Moderators from '../../collections/Moderators';
import Moderator from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ModCard from '../ModeratorCard';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.fetchErrorTitle) {
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
      excludeIDs: [],
      method: 'POST',
      include: '',
      purchase: false, // if this is a child of a purchase, pass to child moderator views
      singleSelect: false,
      selectFirst: false,
      radioStyle: false,
      showInvalid: false,
      wrapperClasses: '',
      hideSpinner: false, // don't block loading moderators with a spinner
      // defaults will be overwritten by passed in options
      ...options,
    };

    if (!opts.apiPath || ['fetchprofiles', 'moderators'].indexOf(opts.apiPath) === -1) {
      throw new Error('The apiPath must be either fetchproviles or moderators');
    }
    if (opts.apiPath === 'moderators') {
      if (opts.moderatorIDs.length) {
        throw new Error('If the apiPath is moderators, a list of IDs is not used.');
      }
      if (opts.include && opts.include !== 'profile') {
        throw new Error('The only valid option currently for include is profile');
      }
    }
    if (opts.apiPath === 'fetchprofiles' && opts.include) {
      throw new Error('If the apiPath is fetchprofiles, the include parameter is not used.');
    }
    if (typeof opts.async !== 'boolean') {
      throw new Error('The value of async must be a boolean');
    }

    if (opts.apiPath === 'moderators') {
      // this will fetch available moderators without POSTing a list of IDs.
      opts.include = 'profile';
      opts.method = 'GET';
    }

    super(opts);
    this.options = opts;
    this.moderatorsCol = new Moderators();
    this.listenTo(this.moderatorsCol, 'add', (model) => {
      this.addMod(model);
    });
    this.modCards = [];
  }

  className() {
    return 'moderatorsList';
  }


  removeNotFetched(ID) {
    this.unfetchedMods = this.unfetchedMods.filter(peerID => peerID !== ID);
    this.checkNotFetched();
  }

  processMod(profile) {
    // don't add profiles that are not moderators unless showInvalid is true. The ID list may have
    // peerIDs that are out of date, and are no longer moderators.
    const validMod = profile.moderator && profile.moderatorInfo;
    // if the moderator has an invalid currency, remove them from the list
    const buyerCur = app.serverConfig.cryptoCurrency;
    const modCurs = profile.moderatorInfo && profile.moderatorInfo.acceptedCurrencies || [];
    const validCur = modCurs.includes(buyerCur);
    // if the moderator is on the list of IDs to exclude, remove them
    const excluded = this.options.excludeIDs.includes(profile.peerID);

    if ((!!validMod && validCur || this.options.showInvalid) && !excluded) {
      this.moderatorsCol.add(new Moderator(profile, { parse: true }));
    } else {
      // remove the invalid moderator from the notFetched list
      this.removeNotFetched(profile.peerId);
    }
  }

  getModeratorsByID(IDs = this.options.moderatorIDs) {
    if (!Array.isArray(IDs)) {
      throw new Error('Please provide the list of moderators as an array.');
    }

    const op = this.options;
    const includeString = op.include ? `&include=${op.include}` : '';
    const urlString =
      `ob/${op.apiPath}?async=${op.async}${includeString}&usecache=${op.useCache}`;
    const url = app.getServerUrl(urlString);

    if (this.fetch && this.fetch.state() === 'pending') return;

    this.unfetchedMods = IDs;
    this.fetchingMods = IDs;
    if (IDs.length) {
      this.$moderatorsStatus.removeClass('hide');
      this.$moderatorStatusText.text(app.polyglot.t('moderators.moderatorsLoading',
          { remaining: IDs.length, total: IDs.length }));
    }

    // Either a list of IDs can be posted, or any available moderators can be retrieved with GET
    if (IDs.length || this.options.method === 'GET') {
      if (!this.options.hideSpinner) this.$moderatorsWrapper.addClass('processing');
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
                    if (IDs.indexOf(eventData.peerId) !== -1) {
                      // don't add errored moderators
                      if (this.options.showInvalid) {
                        this.moderatorsCol.add(new Moderator(eventData, { parse: true }));
                      } else {
                        this.removeNotFetched(eventData.peerId);
                      }
                    }
                  } else if (eventData.id === socketID) {
                    this.processMod(eventData.profile);
                  }
                });
              } else {
                throw new Error('There is no connection to the server to listen to.');
              }
            } else {
              data.forEach(mod => this.processMod(mod.profile));
              this.unfetchedMods = [];
              this.checkNotFetched();
              if (!data.length) this.trigger('noModsFound', { guids: IDs });
            }
          })
          .fail((xhr) => {
            if (xhr.statusText === 'abort') return;
            const failReason = xhr.responseJSON ? `\n\n${xhr.responseJSON.reason}` : '';
            const msg = `${this.options.fetchErrorMsg}${failReason}`;
            openSimpleMessage(this.options.fetchErrorTitle, msg);
            if (!this.options.hideSpinner) this.$moderatorsWrapper.removeClass('processing');
          });
    }
  }

  checkNotFetched() {
    const nfYet = this.unfetchedMods.length;
    // if at least one mod has loaded, remove the spinner
    if (nfYet < this.fetchingMods.length) {
      if (!this.options.hideSpinner) this.$moderatorsWrapper.removeClass('processing');
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

  addMod(model) {
    if (model) {
      const cardState = this.options.cardState;
      const newModView = this.createChild(ModCard, {
        model,
        purchase: this.options.purchase,
        notSelected: this.options.notSelected,
        cardState,
        radioStyle: this.options.radioStyle,
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

  get modCount() {
    // return the number of visible cards. The collection may have unshown invalid moderators.
    return this.modCards.length;
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
        wrapperClasses: this.options.wrapperClasses,
        hideSpinner: this.options.hideSpinner,
      }));

      super.render();
      this.$moderatorsWrapper = this.$('.js-moderatorsWrapper');
      this.$moderatorsStatus = this.$('.js-moderatorsStatus');
      this.$moderatorStatusText = this.$('.js-moderatorStatusInner');

      this.moderatorsCol.forEach(mod => this.addMod(mod));
    });

    return this;
  }
}
