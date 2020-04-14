import _ from 'underscore';
import $ from 'jquery';
import { guid } from '../../../utils/';
import app from '../../../app';
import { anySupportedByWallet } from '../../../data/walletCurrencies';
import loadTemplate from '../../../utils/loadTemplate';
import { getSocket } from '../../../utils/serverConnect';
import Moderators from '../../../collections/Moderators';
import Moderator from '../../../models/profile/Profile';
import baseVw from '../../baseVw';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import ModCard from './Card';
import ModeratorsStatus from './Status';

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
      radioStyle: false,
      controlsOnInvalid: false,
      cardState: 'unselected',
      notSelected: 'unselected',
      showLoadBtn: false,
      showSpinner: true,
      ...options,
      initialState: {
        preferredCurs: [],
        showOnlyCur: '',
        showVerifiedOnly: false,
        loading: false,
        ...options.initialState,
      },
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
    this.excludeIDs = [...opts.excludeIDs, app.profile.id];
    this.modsToFetch = [...opts.moderatorIDs];
    this.unfetchedMods = [];
    this.fetchingVerifiedMods = [];
    this.modFetches = [];
    this.moderatorsCol = new Moderators();
    this.listenTo(this.moderatorsCol, 'add', model => {
      this.addMod(model);
      this.batchCardRender(model);
    });
    this.listenTo(this.moderatorsCol, 'remove', (md) => {
      const removeIndex = this.modCards.findIndex(card => card.model === md);
      this.modCards.splice(removeIndex, 1)[0].remove();
    });
    this.modCards = [];

    // create a moderators status view. It should retain it's state between renders of this view.
    this.moderatorsStatus = this.createChild(ModeratorsStatus, {
      initialState: {
        mode: opts.method === 'GET' ? 'loaded' : 'loadingXofY',
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

  removeNotFetched(IDs) {
    const IDlist = Array.isArray(IDs) ? IDs : [IDs];
    IDlist.forEach(ID => {
      this.unfetchedMods = this.unfetchedMods.filter(peerID => peerID !== ID);
    });
    this.checkNotFetched();
  }

  processMod(data) {
    // Don't add profiles that are not moderators unless showInvalid is true. The ID list may have
    // peerIDs that are out of date, and are no longer moderators.
    const isAMod = data.moderator && data.moderatorInfo;
    // If the moderator has an invalid currency, remove them from the list.
    // With multi-wallet, this should be a very rare occurrence.
    const modCurs = data.moderatorInfo && data.moderatorInfo.acceptedCurrencies || [];
    const hasSupportedCur = anySupportedByWallet(modCurs);
    const newMod = new Moderator(data, { parse: true });

    if ((!!isAMod && hasSupportedCur && newMod.isValid() || this.options.showInvalid)) {
      this.moderatorsCol.add(newMod);
      this.removeNotFetched(data.peerID);
    } else {
      // remove the invalid moderator from the notFetched list
      this.removeNotFetched(data.peerID);
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

    const includeString = op.include ? `&include=${op.include}` : '';

    let urlString =
      `ob/${op.apiPath}?async=${op.async}${includeString}&usecache=${op.useCache}`;
    let asyncID;

    if (op.async) {
      asyncID = guid();
      urlString += `&asyncID=${asyncID}`;
    }

    const url = app.getServerUrl(urlString);

    // don't get any that have already been added or excluded.
    const excluded = [...this.allIDs, ...this.excludeIDs];
    this.modsToFetch = _.without(op.moderatorIDs, ...excluded);
    this.unfetchedMods = [...this.modsToFetch];
    this.fetchingVerifiedMods = app.verifiedMods.matched(this.modsToFetch);

    // Either a list of IDs can be posted, or any available moderators can be retrieved with GET
    if (this.modsToFetch.length || op.method === 'GET') {
      this.setState({
        loading: true,
        noValidModerators: false,
        noValidVerifiedModerators: !this.fetchingVerifiedMods.length,
      });

      this.moderatorsStatus.setState({
        hidden: false,
        loaded: 0,
        toLoad: this.modsToFetch.length,
        total: this.modCount,
        loading: true,
      });

      if (op.async) {
        if (this.serverSocket) {
          this.listenTo(this.serverSocket, 'message', event => {
            const eventData = event.jsonData;
            if (eventData.error) {
              // errors don't have a message id, check to see if the peerID matches
              if (this.modsToFetch.includes(eventData.peerId)) {
                this.processMod(eventData);
              }
            } else if (
              eventData.id === asyncID &&
              !excluded.includes(eventData.peerId) &&
              eventData.profile
            ) {
              this.processMod(eventData.profile);
            }
          });
        } else {
          throw new Error('There is no connection to the server to listen to.');
        }
      }

      const fetch = $.ajax({
        url,
        data: JSON.stringify(this.modsToFetch),
        method: op.method,
      })
          .done((data) => {
            if (!op.async) {
              data.forEach(mod => {
                if (!excluded.includes(mod.peerId)) this.processMod(mod.profile);
              });
              if (!data.length) {
                this.trigger('noModsFound', { guids: this.modsToFetch });
                this.removeNotFetched(this.modsToFetch);
              }
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
    // Collect the models so they can be returned to the caller.
    const removed = [];
    IDs.forEach(id => {
      removed.push(this.moderatorsCol.get(id));
    });
    this.moderatorsCol.remove(IDs);
    return removed;
  }

  checkNotFetched() {
    if (this.unfetchedMods.length === 0) {
      // All ids have been fetched and ids existed to fetch.
      this.moderatorsStatus.setState({
        loading: false,
        hidden: true,
      });
      this.setState({
        loading: false,
      });
    } else {
      // Either ids are still fetching, or this is an open fetch with no set ids.
      this.moderatorsStatus.setState({
        loaded: this.moderatorsCol.length, // not shown if open fetch
        toLoad: this.modsToFetch.length, // not shown if open fetch
        total: this.modCount,
      });
      // re-render to show the unverified moderators button if needed.
      this.render();
    }
  }

  addMod(model) {
    if (!model || !(model instanceof Moderator)) {
      throw new Error('Please provide a valid profile model.');
    }

    const modCard = this.createChild(ModCard, {
      model,
      purchase: this.options.purchase,
      notSelected: this.options.notSelected,
      radioStyle: this.options.radioStyle,
      controlsOnInvalid: this.options.controlsOnInvalid,
      initialState: {
        selectedState: this.options.cardState,
        preferredCurs: this.getState().preferredCurs,
      },
    });
    this.listenTo(modCard, 'modSelectChange', (data) => {
      if (data.selected) {
        // If only one moderator should be selected, deselect the other moderators.
        if (this.options.singleSelect) this.deselectOthers(data.guid);
        this.trigger('cardSelect');
      }
    });
    // Add verified mods to the beginning.
    if (model.isVerified) {
      const firstUnverifiedIndex = this.modCards.findIndex(card => !card.model.isVerified);
      const insertAtIndex = firstUnverifiedIndex < 0 ?
        0 : firstUnverifiedIndex;
      this.modCards.splice(insertAtIndex, 0, modCard);
    } else {
      this.modCards.push(modCard);
    }
    return modCard;
  }

  modShouldRender(model) {
    const hideOnUnverified = this.getState().showVerifiedOnly && !model.isVerified;
    const showCur = this.getState().showOnlyCur;
    const hideOnCur = showCur && !model.hasModCurrency(showCur);
    return !(hideOnUnverified || hideOnCur);
  }

  batchCardRender(model) {
    if (!model || !(model instanceof Moderator)) {
      throw new Error('Please provide a valid profile model.');
    }

    // Render in batches only if the card being added should be visible.
    if (!this.renderTimer && this.modShouldRender(model)) {
      this.renderTimer = setTimeout(() => { this.render(); }, 300);
    }
  }

  get excludeIDs() {
    return this._excludeIDs;
  }

  set excludeIDs(IDs) {
    this._excludeIDs = IDs;
  }

  get modCount() {
    // Return the number of loaded cards. The collection may have unshown invalid moderators. May
    // include cards that are not visible due to the state.
    return this.modCards.length;
  }

  get allIDs() {
    return this.moderatorsCol.pluck('peerID');
  }

  get selectedIDs() {
    const IDs = [];
    this.modCards.forEach((mod) => {
      if (mod.getState().selectedState === 'selected') {
        IDs.push(mod.model.id);
      }
    });
    return IDs;
  }

  get unselectedIDs() {
    const IDs = [];
    this.modCards.forEach((mod) => {
      if (mod.getState().selectedState !== 'selected') {
        IDs.push(mod.model.id);
      }
    });
    return IDs;
  }

  deselectMod(peerID) {
    if (!peerID) throw new Error('You must provide a peerID.');

    const mod = this.modCards.filter(card => card.model.get('peerID') === peerID);
    if (mod.length) mod[0].changeSelectState(this.options.notSelected);
  }

  deselectOthers(peerID = '') {
    this.modCards.forEach((card) => {
      if (card.model.get('peerID') !== peerID) {
        card.changeSelectState(this.options.notSelected);
      }
    });
  }

  togVerifiedShown(bool) {
    this.setState({ showVerifiedOnly: bool });
  }

  get noneSelected() {
    return !this.modCards.filter(mod => mod.getState().selectedState === 'selected').length;
  }

  remove() {
    this.modFetches.forEach(fetch => fetch.abort());
    clearTimeout(this.renderTimer);
    super.remove();
  }

  render() {
    const state = this.getState();
    const showMods = this.modCards.filter(mod => this.modShouldRender(mod.model));
    const unVerCount = this.modCards.filter(mod => (!state.showOnlyCur ||
      mod.model.hasModCurrency(state.showOnlyCur)) && !mod.model.isVerified).length;
    clearTimeout(this.renderTimer);
    this.renderTimer = null;

    loadTemplate('components/moderators/moderators.html', t => {
      this.$el.html(t({
        wrapperClasses: this.options.wrapperClasses,
        purchase: this.options.purchase,
        totalShown: showMods.length,
        unVerCount,
        ...state,
      }));

      super.render();

      const cardsFrag = document.createDocumentFragment();

      this.modCards.forEach((mod) => {
        const newState = {};
        const shouldRender = showMods.includes(mod);
        // Moderators that aren't being rendered should never be selected.
        if (!shouldRender) newState.selectedState = this.options.notSelected;

        mod.setState({
          preferredCurs: state.preferredCurs,
          ...newState,
        }, { renderOnChange: false });

        if (shouldRender) {
          mod.delegateEvents();
          $(cardsFrag).append(mod.render().$el);
        }
      });

      if (showMods.length) {
        this.getCachedEl('.js-moderatorsWrapper').append(cardsFrag);
      } else {
        if (this.modCards.length) this.trigger('noModsShown');
      }

      this.moderatorsStatus.delegateEvents();
      this.getCachedEl('.js-statusWrapper').append(this.moderatorsStatus.render().$el);
    });

    return this;
  }
}
