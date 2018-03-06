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
import ModeratorsStatus from './ModeratorsStatus';

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
   * @param {boolean} options.showLoadBtn       - Show the load more button in the status bar.
   * @param {boolean} options.showSpinner       - Show the spinner in the status bar
   * @param {boolean} options.showVerifiedOnly  - Show only verified moderators
   */

  constructor(options = {}) {
    if (!options.fetchErrorTitle) {
      throw new Error('Please provide error text for the moderator fetch.');
    }

    const opts = {
      className: 'moderatorsList',
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
      controlsOnInvalid: false,
      cardState: 'unselected',
      notSelected: 'unselected',
      showLoadBtn: false,
      showSpinner: true,
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
    this.unfetchedMods = [];
    this.fetchingMods = [];
    this.verifiedMods = [];
    this.modFetches = [];
    this.moderatorsCol = new Moderators();
    this.listenTo(this.moderatorsCol, 'add', model => {
      const modCard = this.addMod(model);

      // if required, select the first  moderator
      if (opts.selectFirst && !this.firstSelected && !this.noneSelected) {
        let selectIt = true;
        // if only verified mods are shown, only select the first verified mod
        if (opts.showVerifiedOnly) selectIt = !!app.verifiedMods.get(model.get('peerID'));

        if (selectIt) {
          this.firstSelected = true;
          modCard.changeSelectState('selected');
        }
      }
      this.render();
    });
    this.listenTo(this.moderatorsCol, 'remove', (md, cl, rOpts) => {
      this.modCards.splice(rOpts.index, 1)[0].remove();
      this.render();
    });
    this.modCards = [];

    // create a moderator status view. It should retain it's state between renders of this view.
    this.moderatorsStatus = this.createChild(ModeratorsStatus, {
      initialState: {
        mode: opts.method === 'GET' ? 'loaded' : '',
        showLoadBtn: opts.showLoadBtn,
        showSpinner: opts.showSpinner,
      },
    });
    this.listenTo(this.moderatorsStatus, 'browseMore', () => this.onBrowseMore());

    // listen to the websocket for moderator data
    this.serverSocket = getSocket();
  }

  events() {
    return {
      'click .js-showUnverified': 'clickShowUnverified',
    };
  }

  clickShowUnverified() {
    this.togVerifiedShown(false);
    this.trigger('clickShowUnverified');
  }

  onBrowseMore() {
    this.getModeratorsByID();
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

    if ((!!validMod && validCur || this.options.showInvalid)) {
      this.moderatorsCol.add(new Moderator(profile, { parse: true }));
      this.removeNotFetched(profile.peerID);
    } else {
      // remove the invalid moderator from the notFetched list
      this.removeNotFetched(profile.peerID);
    }
  }

  getModeratorsByID(opts) {
    const op = {
      ...this.options,
      ...opts,
    };

    if (!Array.isArray(op.moderatorIDs)) {
      throw new Error('Please provide the list of moderators as an array.');
    }

    // don't get any that have already been added or excluded, or the user's own id.
    const excluded = [...this.allIDs, ...op.excludeIDs, app.profile.id];
    const IDs = _.without(op.moderatorIDs, excluded);
    const includeString = op.include ? `&include=${op.include}` : '';
    const urlString =
      `ob/${op.apiPath}?async=${op.async}${includeString}&usecache=${op.useCache}`;
    const url = app.getServerUrl(urlString);

    this.unfetchedMods = IDs;
    this.fetchingMods = IDs;
    this.verifiedMods = app.verifiedMods.matched(IDs);

    this.setState({
      noValidModerators: false,
      noValidVerifiedModerators: !this.verifiedMods.length && this.fetchingMods.length,
    });

    // Either a list of IDs can be posted, or any available moderators can be retrieved with GET
    if (IDs.length || op.method === 'GET') {
      this.moderatorsStatus.setState({
        hidden: false,
        loaded: this.modCount,
        total: IDs.length ? IDs.length : this.modCount,
        showSpinner: op.showSpinner, //unhides the spinner if it's been hidden by the timer
      });

      const fetch = $.ajax({
        url,
        data: JSON.stringify(IDs),
        method: op.method,
      })
          .done((data) => {
            if (op.async) {
              const socketID = data.id;
              if (this.serverSocket) {
                this.listenTo(this.serverSocket, 'message', (event) => {
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
                  } else if (eventData.id === socketID && !excluded.includes(eventData.peerId)) {
                    this.processMod(eventData.profile);
                  }
                });
              } else {
                throw new Error('There is no connection to the server to listen to.');
              }
            } else {
              data.forEach(mod => {
                if (!excluded.includes(mod.peerId)) this.processMod(mod.profile);
              });
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
      this.modFetches.push(fetch);
    }
  }

  removeModeratorsByID(IDs) {
    if (!IDs) {
      throw new Error('You must provide the ID or IDs to remove.');
    }
    // collect the models so they can be returned to the caller
    const removed = [];
    IDs.forEach(id => {
      removed.push(this.moderatorsCol.get(id));
    });
    this.moderatorsCol.remove(IDs);
    return removed;
  }

  checkNotFetched() {
    const nfYet = this.unfetchedMods.length;
    if (nfYet === 0 && this.fetchingMods.length) {
      // all ids have been fetched and ids existed to fetch
      this.moderatorsStatus.setState({
        hidden: true,
      });
      // check if there are mods that loaded but none were valid
      if (!this.moderatorsCol.length && this.fetchingMods.length) {
        this.trigger('noValidModerators');
        this.setState({ noValidModerators: true });
      }
      // check if no valid verified mods where loaded
      if (this.verifiedMods.length && !this.modCount) {
        this.trigger('noValidVerifiedModerators');
        this.setState({ noValidVerifiedModerators: true });
      }
    } else {
      // either ids are still fetching, or this is an open fetch with no set ids
      this.moderatorsStatus.setState({
        loaded: this.fetchingMods.length - nfYet, // not shown if open fetch
        total: this.fetchingMods.length ? this.fetchingMods.length : this.modCount,
      });
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
      if (data.selected) {
        this.noneSelected = false;
        // if only one moderator should be selected, deselect the other moderators
        if (this.options.singleSelect) this.deselectOthers(data.guid);
        this.trigger('cardSelect');
      }
    });
    // add verified mods to the beginning
    if (app.verifiedMods.get(model.get('peerID'))) {
      this.modCards.unshift(modCard);
    } else {
      this.modCards.push(modCard);
    }
    return modCard;
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

  deselectMod(guid) {
    if (!guid) throw new Error('You must provide a guid.');

    const mod = this.modCards.filter(card => card.model.get('peerID') === guid);
    if (mod.length) mod[0].changeSelectState(this.options.notSelected);
  }

  deselectOthers(guid = '') {
    this.modCards.forEach((card) => {
      if (card.model.get('peerID') !== guid) {
        card.changeSelectState(this.options.notSelected);
      }
    });
    this.noneSelected = !guid;
  }

  togVerifiedShown(bool) {
    this.setState({ showVerifiedOnly: bool });
  }

  get noneSelected() {
    return this._noneSelected;
  }

  set noneSelected(bool) {
    this._noneSelected = bool;
  }

  remove() {
    this.modFetches.forEach(fetch => fetch.abort());
    super.remove();
  }

  render() {
    loadTemplate('components/moderators.html', t => {
      this.$el.html(t({
        wrapperClasses: this.options.wrapperClasses,
        showVerifiedOnly: this.options.showVerifiedOnly,
        placeholder: !this.modCards.length,
        ...this.getState(),
      }));

      super.render();
      this.modCards.forEach(mod => {
        mod.delegateEvents();
        this.getCachedEl('.js-moderatorsWrapper').append(mod.render().$el);
      });

      this.moderatorsStatus.delegateEvents();
      this.getCachedEl('.js-statusWrapper').append(this.moderatorsStatus.render().$el);
    });

    return this;
  }
}
