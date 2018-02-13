import _ from 'underscore';
import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import { getSocket } from '../../utils/serverConnect';
import { openSimpleMessage } from '../modals/SimpleMessage';
import Moderators from '../../collections/Moderators';
import Moderator from '../../models/profile/Profile';
import baseVw from '../baseVw';
import ModCard from './ModeratorCard';

export default class extends baseVw {
  /**
   * @param {string}  options.apiPath           - Current options are fetchprofiles and moderators.
   * @param {boolean} options.async             - Return profiles via websocket.
   * @param {boolean} options.useCache          - Use cached data for faster speed.
   * @param {array}   options.moderatorIDs      - list of moderators to retrieve. If none get all.
   * @param {array}   options.excludeIDs        - list of moderators to not use.
   * @param {string}  options.method            - POST or GET
   * @param {string}  options.include           - If apiPath is moderator, set to 'profile' or only
   *                                              the peerIDs of each moderator are returned.
   * @param {boolean} options.purchase          - If this is used in a purchase, pass this to the
   *                                              child moderator card views.
   * @param {boolean} options.singleSelect      - Allow only one moderator to be selected at a time.
   * @param {boolean} options.selectFirst       - Pre-select the first moderator.
   * @param {boolean} options.radioStyle        - Show the moderator cards with radio buttons.
   * @param {boolean} options.showInvalid       - Show invalid moderator cards.
   * @param {boolean} options.controlsOnInvalid - Show controls on invalid cards so they can be
   *                                              removed or otherwise acted on.
   * @param {string}  options.wrapperClasses    - Add classes to the card container.
   * @param {string}  options.fetchErrorTitle   - A title for the fetch error.
   * @param {string}  options.cardState         - The initial state for cards that are created.
   * @param {string}  options.notSelected       - Which not selected state to use on the mod cards.
   */

  constructor(options = {}) {
    if (!options.fetchErrorTitle) {
      throw new Error('Please provide error text for the moderator fetch.');
    }

    const opts = {
      apiPath: 'fetchprofiles',
      async: true,
      useCache: true,
      moderatorIDs: [],
      excludeIDs: [],
      method: 'POST',
      include: '',
      purchase: false,
      singleSelect: false,
      selectFirst: false,
      radioStyle: false,
      showInvalid: false,
      controlsOnInvalid: false,
      wrapperClasses: '',
      cardState: 'unselected',
      notSelected: 'unselected',
      ...options,
    };

    if (!opts.apiPath || ['fetchprofiles', 'moderators'].indexOf(opts.apiPath) === -1) {
      throw new Error('The apiPath must be either fetchprofiles or moderators');
    }
    if (opts.apiPath === 'moderators') {
      if (opts.moderatorIDs.length) {
        throw new Error('If the apiPath is moderators, a list of IDs is not used.');
      }
    } else if (opts.apiPath === 'fetchprofiles' && opts.include) {
      throw new Error('If the apiPath is fetchprofiles, the include parameter is not used.');
    }
    if (typeof opts.async !== 'boolean') {
      throw new Error('The value of async must be a boolean');
    }
    if (!opts.fetchErrorTitle) {
      throw new Error('Please provide a title for the fetch error.');
    }

    if (opts.apiPath === 'moderators') {
      // this will fetch available moderators without POSTing a list of IDs.
      opts.include = 'profile';
      opts.method = 'GET';
    }

    super(opts);
    this.options = opts;
    this.excludeIDs = opts.excludeIDs;
    this.moderatorsCol = new Moderators();
    this.listenTo(this.moderatorsCol, 'add', model => {
      const modCard = this.addMod(model);
      this.$moderatorsWrapper.append(modCard.render().$el);
      // if required, select the first  moderator
      if (opts.selectFirst && !this.firstSelected && !this.noneSelected) {
        this.firstSelected = true;
        modCard.changeSelectState('selected');
      }
    });
    this.listenTo(this.moderatorsCol, 'remove', (md, cl, rOpts) => this.removeMod(md, cl, rOpts));
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
    // if the moderator is on the list of IDs to exclude, or is this user, remove them
    const excluded = this.excludeIDs.includes(profile.peerID) || profile.peerID === app.profile.id;

    if ((!!validMod && validCur || this.options.showInvalid) && !excluded) {
      this.moderatorsCol.add(new Moderator(profile, { parse: true }));
      this.removeNotFetched(profile.peerId);
    } else {
      // remove the invalid moderator from the notFetched list
      this.removeNotFetched(profile.peerId);
    }
  }

  getModeratorsByID(IDparam = this.options.moderatorIDs) {
    if (!Array.isArray(IDparam)) {
      throw new Error('Please provide the list of moderators as an array.');
    }

    if (this.fetch && this.fetch.state() === 'pending') return;

    // don't get any that have already been added
    const IDs = _.without(IDparam, this.allIDs);
    const op = this.options;
    const includeString = op.include ? `&include=${op.include}` : '';
    const urlString =
      `ob/${op.apiPath}?async=${op.async}${includeString}&usecache=${op.useCache}`;
    const url = app.getServerUrl(urlString);

    this.unfetchedMods = IDs;
    this.fetchingMods = IDs;
    if (IDs.length) {
      this.$moderatorsStatus.removeClass('hide');
      this.$moderatorStatusText.text(app.polyglot.t('moderators.moderatorsLoading',
          { remaining: IDs.length, total: IDs.length }));
    }

    // Either a list of IDs can be posted, or any available moderators can be retrieved with GET
    if (IDs.length || op.method === 'GET') {
      this.fetch = $.ajax({
        url,
        data: JSON.stringify(IDs),
        method: op.method,
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
                    if (IDs.includes(eventData.peerId)) {
                      if (op.showInvalid) {
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
            const msg = `${op.fetchErrorMsg}${failReason}`;
            openSimpleMessage(op.fetchErrorTitle, msg);
          });
    }
  }

  removeModeratorsByID(IDs) {
    if (!IDs) {
      throw new Error('You must provide the ID or IDs to remove.');
    }

    this.moderatorsCol.remove(IDs);
  }

  checkNotFetched() {
    const nfYet = this.unfetchedMods.length;
    if (nfYet === 0) {
      // all ids have been fetched
      this.$moderatorsStatus.addClass('hide');
      this.$moderatorStatusText.text('');
      // check if there are mods that loaded but none were valid
      if (!this.moderatorsCol.length && this.fetchingMods.length) {
        this.trigger('noValidModerators');
      }
    } else {
      this.$moderatorStatusText.text(app.polyglot.t('moderators.moderatorsLoading',
          { remaining: nfYet, total: this.fetchingMods.length }));
    }
  }


  addMod(model) {
    if (!model || !(model instanceof Moderator)) {
      throw new Error('Please provide a moderator model.');
    }

    const modCard = this.createChild(ModCard, {
      model,
      purchase: this.options.purchase,
      notSelected: this.options.notSelected,
      cardState: this.options.cardState,
      radioStyle: this.options.radioStyle,
      controlsOnInvalid: this.options.controlsOnInvalid,
    });
    this.listenTo(modCard, 'modSelectChange', (data) => {
      // if only one moderator should be selected, deselect the other moderators
      if (this.options.singleSelect && data.selected) this.deselectOthers(data.guid);
    });
    this.removeNotFetched(model.id);
    this.modCards.push(modCard);
    return modCard;
  }

  removeMod(md, cl, opts) {
    if (md) {
      this.modCards.splice(opts.index, 1)[0].remove();
    }
  }

  get excludeIDs() {
    return this._excludeIDs;
  }

  set excludeIDs(IDs) {
    this._excludeIDs = IDs;
  }

  get modCount() {
    // return the number of visible cards. The collection may have unshown invalid moderators.
    return this.modCards.length;
  }

  get allIDs() {
    return this.moderatorsCol.pluck('peerID');
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

  get unselectedIDs() {
    const IDs = [];
    this.modCards.forEach((mod) => {
      if (mod.cardState !== 'selected') {
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
    loadTemplate('components/moderators.html', t => {
      this.$el.html(t({
        wrapperClasses: this.options.wrapperClasses,
      }));

      super.render();
      this.$moderatorsWrapper = this.$('.js-moderatorsWrapper');
      this.$moderatorsStatus = this.$('.js-moderatorsStatus');
      this.$moderatorStatusText = this.$('.js-moderatorStatusInner');

      this.modCards.forEach(mod => {
        mod.delegateEvents();
        this.$moderatorsWrapper.append(mod.render().$el);
      });
    });

    return this;
  }
}
