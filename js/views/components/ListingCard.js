import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { abbrNum } from '../../utils';
import { launchEditListingModal } from '../../utils/modalManager';
import { isBlocked, isUnblocking, events as blockEvents } from '../../utils/block';
import { isHiRez } from '../../utils/responsive';
import { startAjaxEvent, endAjaxEvent, recordEvent } from '../../utils/metrics';
import { getNewerHash, outdateHash } from '../../utils/outdatedlistingCIDs';
import Listing from '../../models/listing/Listing';
import ListingShort from '../../models/listing/ListingShort';
import { events as listingEvents } from '../../models/listing/';
import baseVw from '../baseVw';
import { openSimpleMessage } from '../../views/modals/SimpleMessage';
import ListingDetail from '../modals/listingDetail/Listing';
import Report from '../modals/Report';
import BlockedWarning from '../modals/BlockedWarning';
import ReportBtn from '../components/ReportBtn';
import BlockBtn from '../components/BlockBtn';
import VerifiedMod, { getListingOptions } from '../components/VerifiedMod';
import UserLoadingModal from '../../views/userPage/Loading';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      viewType: 'grid',
      reportsUrl: '',
      searchUrl: '',
      showErrorCardOnError: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.cardError = false;

    try {
      if (!this.model || !(this.model instanceof ListingShort)) {
        throw new Error('Please provide a ListingShort model.');
      }

      // Any provided profile model or vendor info object will also be passed into the
      // listing detail modal.
      if (opts.profile) {
        // If a profile model of the listing owner is available, please pass it in.
        this.ownerGuid = opts.profile.id;
      } else if (this.model.get('vendor')) {
        // If a vendor object is available (part of proposed search API), please pass it in.
        this.ownerGuid = this.model.get('vendor').peerID;
      } else {
        // Otherwise please provide the store owner's guid.
        this.ownerGuid = opts.ownerGuid;
      }

      if (typeof this.ownerGuid === 'undefined') {
        throw new Error('Unable to determine ownership of the listing. Please either provide' +
          ' a profile model or pass in an ownerGuid option.');
      }

      if (!opts.listingBaseUrl) {
        // When the listing card is clicked and the listing detail modal is
        // opened, the slug of the listing is concatenated with the listingBaseUrl
        // and the route is updated (both history & address bar).
        throw new Error('Please provide a listingBaseUrl.');
      }

      if (this.ownListing) {
        this.$el.addClass('ownListing');
      }

      if (this.ownListing) {
        this.listenTo(listingEvents, 'destroying', (md, destroyingOpts) => {
          if (this.isRemoved()) return;

          if (destroyingOpts.slug === this.model.get('slug')) {
            this.$el.addClass('listingDeleting');
          }

          destroyingOpts.xhr.fail(() => (this.$el.removeClass('listingDeleting')));
        });

        this.listenTo(listingEvents, 'destroy', (md, destroyOpts) => {
          if (this.isRemoved()) return;

          if (destroyOpts.slug === this.model.get('slug')) {
            this.$el.addClass('listingDeleted');
          }
        });
      }

      this.viewType = opts.viewType;
      this.reportsUrl = opts.reportsUrl;
      this.deleteConfirmOn = false;
      this.boundDocClick = this.onDocumentClick.bind(this);
      // This should be initialized as null, so we could determine whether the user
      // never set this (null), or explicitly clicked to show / hide nsfw (true / false)
      this._userClickedShowNsfw = null;
      $(document).on('click', this.boundDocClick);

      this.listenTo(blockEvents, 'blocked unblocked', data => {
        if (data.peerIds.includes(this.ownerGuid)) {
          this.setBlockedClass();
        }
      });

      this.listenTo(app.settings, 'change:showNsfw', () => {
        this._userClickedShowNsfw = null;
        this.setHideNsfwClass();
      });

      this.verifiedMods = app.verifiedMods.matched(this.model.get('moderators'));

      this.listenTo(app.verifiedMods, 'update', () => {
        const newVerifiedMods = app.verifiedMods.matched(this.model.get('moderators'));
        if ((this.verifiedMods.length && !newVerifiedMods.length) ||
          (!this.verifiedMods.length && newVerifiedMods.length)) {
          this.verifiedMods = newVerifiedMods;
          this.render();
        }
      });

      // load necessary images in a cancelable way
      const thumbnail = this.model.get('thumbnail');
      const listingImageSrc = this.viewType === 'grid' ?
        app.getServerUrl(
          `v1/ob/image/${isHiRez() ? thumbnail.medium : thumbnail.small}`
        ) :
        app.getServerUrl(
          `v1/ob/image/${isHiRez() ? thumbnail.small : thumbnail.tiny}`
        );

      this.listingImage = new Image();
      this.listingImage.addEventListener('load', () => {
        this.listingImage.loaded = true;
        this.$('.js-listingImage')
          .css('backgroundImage', `url(${listingImageSrc})`);
      });
      this.listingImage.src = listingImageSrc;

      const vendor = this.model.get('vendor');
      if (vendor && vendor.avatarHashes) {
        const avatarImageSrc = app.getServerUrl(
          `v1/ob/image/${isHiRez() ? vendor.avatarHashes.small : vendor.avatarHashes.tiny}`
        );

        this.avatarImage = new Image();
        this.avatarImage.addEventListener('load', () => {
          this.avatarImage.loaded = true;
          this.$('.js-vendorIcon')
            .css('backgroundImage', `url(${avatarImageSrc})`);
        });
        this.avatarImage.src = avatarImageSrc;
      }
    } catch (e) {
      this.cardError = e.message || true;

      if (opts.showErrorCardOnError) {
        this.render();
        return;
      }

      throw e;
    }
  }

  className() {
    return 'listingCard col clrBr clrHover clrT clrP clrSh2 contentBox';
  }

  attributes() {
    // make it possible to tab to this element
    return { tabIndex: 0 };
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
      'click .js-delete': 'onClickDelete',
      'click .js-clone': 'onClickClone',
      'click .js-userLink': 'onClickUserLink',
      'click .js-deleteConfirmed': 'onClickConfirmedDelete',
      'click .js-deleteConfirmCancel': 'onClickConfirmCancel',
      'click .js-deleteConfirmedBox': 'onClickDeleteConfirmBox',
      'click .js-showNsfw': 'onClickShowNsfw',
      'click .js-hideNsfw': 'onClickHideNsfw',
      click: 'onClick',
    };
  }

  onDocumentClick() {
    this.getCachedEl('.js-deleteConfirmedBox').addClass('hide');
    this.deleteConfirmOn = false;
  }

  onClickEdit(e) {
    recordEvent('Lisitng_EditFromCard');
    app.loadingModal.open();

    this.fetchFullListing()
      .done(xhr => {
        if (xhr.statusText === 'abort' || this.isRemoved()) return;

        launchEditListingModal({
          model: this.fullListing,
        });
      })
      .always(() => {
        if (this.isRemoved()) return;
        app.loadingModal.close();
      });

    e.stopPropagation();
  }

  onClickDelete(e) {
    recordEvent('Lisitng_DeleteFromCard');
    this.getCachedEl('.js-deleteConfirmedBox').removeClass('hide');
    this.deleteConfirmOn = true;
    e.stopPropagation();
  }

  onClickClone(e) {
    recordEvent('Lisitng_CloneFromCard');
    app.loadingModal.open();

    this.fetchFullListing()
      .done(xhr => {
        if (xhr.statusText === 'abort' || this.isRemoved()) return;
        launchEditListingModal({
          model: this.fullListing.cloneListing(),
        });
      })
      .always(() => {
        if (this.isRemoved()) return;
        app.loadingModal.close();
      });

    e.stopPropagation();
  }

  onClickConfirmedDelete(e) {
    recordEvent('Lisitng_DeleteFromCardConfirm');
    e.stopPropagation();
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;
    this.destroyRequest = this.model.destroy({ wait: true });
  }

  onClickConfirmCancel() {
    recordEvent('Lisitng_DeleteFromCardCancel');
    this.getCachedEl('.js-deleteConfirmedBox').addClass('hide');
    this.deleteConfirmOn = false;
  }

  onClickDeleteConfirmBox(e) {
    e.stopPropagation();
  }

  onClickUserLink(e) {
    e.stopPropagation();
  }

  loadListingDetail(hash = this.model.get('cid')) {
    const routeOnOpen = location.hash.slice(1);
    app.router.navigateUser(`${this.options.listingBaseUrl}${this.model.get('slug')}`,
      this.ownerGuid);

    startAjaxEvent('Listing_LoadFromCard');
    const segmentation = {
      ownListing: !!this.ownListing,
      openedFromStore: !!this.options.onStore,
      searchUrl: this.options.searchUrl && this.options.searchUrl.hostname || 'none',
    };

    let storeName = `${this.ownerGuid.slice(0, 8)}…`;
    let avatarHashes;
    let title = this.model.get('title');
    title = title.length > 25 ?
      `${title.slice(0, 25)}…` : title;

    if (this.options.profile) {
      storeName = this.options.profile.get('name');
      avatarHashes = this.options.profile.get('avatarHashes')
        .toJSON();
    } else if (this.options.vendor) {
      storeName = this.options.vendor.name;
      avatarHashes = this.options.vendor.avatarHashes;
    }

    if (storeName.length > 40) {
      storeName = `${storeName.slice(0, 40)}…`;
    }

    let ipnsFetch = this.ipnsFetch = null;
    let ipfsFetch = this.ipfsFetch = null;

    const onFailedListingFetch = xhr => {
      if (typeof xhr !== 'object') {
        throw new Error('Please provide the failed xhr.');
      }

      this.userLoadingModal.setState({
        contentText: app.polyglot.t('userPage.loading.failTextListing', {
          listing: `<b>${title}</b>`,
        }),
        isProcessing: false,
      });

      let err = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText ||
          'unknown error';
      // Consolidate and remove specific data from no link errors.
      if (err.startsWith('no link named')) err = 'no link named under hash';
      endAjaxEvent('Listing_LoadFromCard', {
        ...segmentation,
        errors: err,
      });
    };

    const showListingDetail = () => {
      endAjaxEvent('Listing_LoadFromCard', {
        ...segmentation,
      });

      const listingDetail = new ListingDetail({
        model: this.fullListing,
        profile: this.options.profile,
        vendor: this.options.vendor,
        closeButtonClass: 'cornerTR iconBtn clrP clrBr clrSh3 toolTipNoWrap',
        modelContentClass: 'modalContent',
        openedFromStore: !!this.options.onStore,
        checkNsfw: !this._userClickedShowNsfw,
      }).render()
        .open();

      const onListingDetailClose = () => {
        app.router.navigate(routeOnOpen);
        if (ipfsFetch) ipfsFetch.abort();
        ipnsFetch.abort();
      };

      listingDetail.purchaseModal
        .progress(getPurchaseE => {
          if (getPurchaseE.type === ListingDetail.PURCHASE_MODAL_CREATE) {
            const purchaseModal = getPurchaseE.view;
            this.listenTo(purchaseModal, 'clickReloadOutdated', e => {
              e.preventDefault();
              listingDetail.render();
              purchaseModal.remove();
            });
          }
        });

      this.listenTo(listingDetail, 'close', onListingDetailClose);
      this.listenTo(listingDetail, 'modal-will-remove',
        () => this.stopListening(null, null, onListingDetailClose));
      this.listenTo(listingDetail, 'clickReloadOutdated',
        e => {
          // Since the model will already have been updated by
          // handleOutdated, we could just re-render here.
          listingDetail.render();
          e.preventDefault();
        });

      this.trigger('listingDetailOpened');
      this.userLoadingModal.remove();
      app.loadingModal.close();
    };

    const handleOutdatedHash = (listingData = {}, hashData) => {
      const { oldHash, newHash } = hashData;

      if (typeof listingData !== 'object') {
        throw new Error('Please provide the listing data as an object.');
      }

      if (typeof oldHash !== 'string' || !oldHash) {
        throw new Error('Please provide an oldHash as a non-empty string.');
      }

      if (typeof newHash !== 'string' || !newHash) {
        throw new Error('Please provide an newHash as a non-empty string.');
      }

      recordEvent('Lisitng_OutdatedHashFromCard', segmentation);

      this.fullListing.set(this.fullListing.parse(listingData));

      // push mapping to outdatedHashes collection
      outdateHash(oldHash, newHash);
    };

    const loadListing = () => {
      const listingCID = getNewerHash(hash || this.model.get('cid'));

      if (listingCID && this.ownerGuid !== app.profile.id) {
        ipfsFetch = this.fullListing.fetch({
          hash: listingCID,
          showErrorOnFetchFail: false,
        });
        ipnsFetch = $.ajax(
          Listing.getIpnsUrl(
            this.ownerGuid,
            this.model.get('slug')
          )
        );
      } else {
        ipnsFetch = this.fullListing.fetch({ showErrorOnFetchFail: false });
      }

      if (this.userLoadingModal) this.userLoadingModal.remove();
      this.userLoadingModal = new UserLoadingModal({
        initialState: {
          userName: avatarHashes ? storeName : undefined,
          userAvatarHashes: avatarHashes,
          contentText: app.polyglot.t('userPage.loading.loadingText', {
            name: `<b>${title}</b>`,
          }),
          isProcessing: true,
        },
      });

      this.listenTo(this.userLoadingModal, 'clickCancel',
        () => {
          ipnsFetch.abort();
          if (ipfsFetch) ipfsFetch.abort();
          this.userLoadingModal.remove();
          app.router.navigate(routeOnOpen);
        });

      this.listenTo(this.userLoadingModal, 'clickRetry',
        () => {
          app.router.navigate(routeOnOpen);
          this.loadListingDetail(hash);
        });

      this.userLoadingModal.render()
        .open();

      ipnsFetch.done((data, textStatus, xhr) => {
        if (xhr.statusText === 'abort' || this.isRemoved()) return;

        if (
          ipfsFetch &&
          ['pending', 'rejected'].includes(ipfsFetch.state())
        ) {
          ipfsFetch.abort();
          this.fullListing.set(this.fullListing.parse(data));
        }

        if (ipfsFetch && ipfsFetch.state() === 'resolved') {
          if (listingCID !== data.hash) {
            handleOutdatedHash(data, {
              oldHash: listingCID,
              newHash: data.hash,
            });
          }
        } else {
          showListingDetail();
        }
      }).fail(xhr => {
        if (xhr.statusText === 'abort') return;

        if (
          ipfsFetch &&
          ['pending', 'resolved'].includes(ipfsFetch.state())
        ) return;

        onFailedListingFetch(xhr);
      });

      if (ipfsFetch) {
        ipfsFetch.done((data, textStatus, xhr) => {
          if (xhr.statusText === 'abort' || this.isRemoved()) return;
          showListingDetail();
        }).fail(xhr => {
          if (xhr.statusText === 'abort') return;
          onFailedListingFetch(xhr);
        });
      }
    };

    if (isBlocked(this.ownerGuid) && !isUnblocking(this.ownerGuid)) {
      const blockedWarningModal = new BlockedWarning({ peerId: this.ownerGuid })
        .render()
        .open();

      this.listenTo(blockedWarningModal, 'canceled', () => {
        app.router.navigate(routeOnOpen);
      });

      const onUnblock = () => loadListing();

      this.listenTo(blockEvents, 'unblocking unblocked', onUnblock);

      this.listenTo(blockedWarningModal, 'close', () => {
        this.stopListening(null, null, onUnblock);
      });
    } else {
      loadListing();
    }
  }

  onClick(e) {
    if (this.deleteConfirmOn) return;
    if (!this.ownListing ||
        (e.target !== this.$btnEdit[0] && e.target !== this.$btnDelete[0] &&
         !$.contains(this.$btnEdit[0], e.target) && !$.contains(this.$btnDelete[0], e.target))) {
      this.loadListingDetail();
    }
  }

  onClickShowNsfw(e) {
    e.stopPropagation();
    this._userClickedShowNsfw = true;
    this.setHideNsfwClass();
  }

  onClickHideNsfw(e) {
    e.stopPropagation();
    this._userClickedShowNsfw = false;
    this.setHideNsfwClass();
  }

  setBlockedClass() {
    this.$el.toggleClass('blocked', isBlocked(this.ownerGuid));
  }

  setHideNsfwClass() {
    this.$el.toggleClass('hideNsfw',
      // explicitly checking for false, since null means something different
      this._userClickedShowNsfw === false ||
      (
        this.model.get('nsfw') &&
        !this._userClickedShowNsfw &&
        !app.settings.get('showNsfw')
      )
    );
  }

  fetchFullListing(options = {}) {
    const opts = {
      showErrorOnFetchFail: true,
      ...options,
    };

    if (this.fullListingFetch && this.fullListingFetch.state() === 'pending') {
      return this.fullListingFetch;
    }

    this.fullListingFetch = this.fullListing.fetch()
      .fail(xhr => {
        if (!opts.showErrorOnFetchFail || xhr.statusText === 'abort' ||
          this.isRemoved()) return;
        let failReason = xhr.responseJSON && xhr.responseJSON.reason || '';

        if (xhr.status === 404) {
          failReason = app.polyglot.t('listingCard.editFetchErrorDialog.bodyNotFound');
        }

        openSimpleMessage(
          app.polyglot.t('listingCard.editFetchErrorDialog.title'),
          failReason
        );
      });

    return this.fullListingFetch;
  }

  onReportSubmitted() {
    this.reportBtn.setState({ reported: true });
  }

  startReport() {
    if (this.report) this.report.remove();

    this.report = this.createChild(Report, {
      removeOnClose: true,
      peerID: this.ownerGuid,
      slug: this.model.get('slug'),
      url: this.reportsUrl,
    })
      .render()
      .open();

    this.report.on('modal-will-remove', () => (this.report = null));
    this.listenTo(this.report, 'submitted', this.onReportSubmitted);
  }

  get ownListing() {
    return app.profile.id === this.ownerGuid;
  }

  get fullListing() {
    if (!this._fullListing) {
      this._fullListing = new Listing({
        slug: this.model.get('slug'),
      }, {
        guid: this.ownerGuid,
      });
    }

    return this._fullListing;
  }

  get viewType() {
    return this._viewType;
  }

  set viewType(type) {
    if (['list', 'grid', 'cryptoList'].indexOf(type) === -1) {
      throw new Error('The provided view type is not one of the available types.');
    }

    // This just sets the flag. It's up to you to re-render.
    this._viewType = type;
  }

  get $btnEdit() {
    return this._$btnEdit ||
      (this._$btnEdit = this.$('.js-edit'));
  }

  get $btnDelete() {
    return this._$btnDelete ||
      (this._$btnDelete = this.$('.js-delete'));
  }

  remove() {
    if (this.listingImage) this.listingImage.src = '';
    if (this.avatarImage) this.avatarImage.src = '';
    if (this.fullListingFetch) this.fullListingFetch.abort();
    if (this.destroyRequest) this.destroyRequest.abort();
    $(document).off('click', this.boundDocClick);
    if (this.userLoadingModal) this.userLoadingModal.remove();
    if (this.ipnsFetch) this.ipnsFetch.abort();
    if (this.ipfsFetch) this.ipfsFetch.abort();
    super.remove();
  }

  render(cardError = this.cardError) {
    let _cardError = cardError;

    if (!_cardError) {
      try {
        super.render();

        loadTemplate('components/listingCard.html', (t) => {
          this.$el.html(t({
            ...this.model.toJSON(),
            ownListing: this.ownListing,
            shipsFreeToMe: this.model.shipsFreeToMe,
            viewType: this.viewType,
            displayCurrency: app.settings.get('localCurrency'),
            isBlocked,
            isUnblocking,
            listingImageSrc: this.listingImage.loaded &&
              this.listingImage.src || '',
            vendorAvatarImageSrc: this.avatarImage && this.avatarImage.loaded &&
              this.avatarImage.src || '',
            abbrNum,
          }));
        });

        this._$btnEdit = null;
        this._$btnDelete = null;

        this.setBlockedClass();
        this.setHideNsfwClass();
        this.$el.toggleClass('isNsfw', this.model.get('nsfw'));

        if (this.reportBtn) this.reportBtn.remove();
        if (this.reportsUrl) {
          this.reportBtn = this.createChild(ReportBtn);
          this.listenTo(this.reportBtn, 'startReport', this.startReport);
          this.getCachedEl('.js-reportBtnWrapper').append(this.reportBtn.render().el);
        }

        if (!this.ownListing) {
          this.getCachedEl('.js-blockBtnWrapper').html(
            new BlockBtn({
              targetId: this.ownerGuid,
              initialState: { useIcon: true },
            })
              .render()
              .el
          );
        }

        const moderators = this.model.get('moderators') || [];
        const verifiedIDs = app.verifiedMods.matched(moderators);
        const verifiedID = verifiedIDs[0];

        if (this.verifiedMod) this.verifiedMod.remove();
        this.verifiedMod = this.createChild(VerifiedMod, getListingOptions({
          model: verifiedID &&
            app.verifiedMods.get(verifiedID),
        }));
        this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
      } catch (e) {
        if (!this.options.showErrorCardOnError) throw e;
        _cardError = e.message || true;
      }
    }

    if (_cardError) {
      this.$el.addClass('ListingCard-errorCard');
      this.$el.removeClass('clrHover');

      let messageHtml = app.polyglot.t('listingCard.cardError');

      if (typeof _cardError === 'string') {
        messageHtml +=
          `&nbsp;<span class="toolTip" data-tip="${_cardError}">` +
          '<span class="ion-help-circled clrTErr"></span></span>';
      }

      this.$el.html(`<p class="padMd clrTErr tx5">${messageHtml}</p>`);
    }

    return this;
  }
}
