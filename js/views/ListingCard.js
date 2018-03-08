import $ from 'jquery';
import app from '../app';
import loadTemplate from '../utils/loadTemplate';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import { launchEditListingModal } from '../utils/modalManager';
import { isBlocked, isUnblocking, events as blockEvents } from '../utils/block';
import Listing from '../models/listing/Listing';
import ListingShort from '../models/listing/ListingShort';
import { events as listingEvents } from '../models/listing/';
import baseVw from './baseVw';
import ListingDetail from './modals/listingDetail/Listing';
import ReportBtn from './components/ReportBtn';
import Report from './modals/Report';
import BlockedWarning from './modals/BlockedWarning';
import BlockBtn from './components/BlockBtn';
import VerifiedMod from './components/VerifiedMod';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      viewType: 'grid',
      reportsUrl: '',
      ...options,
    };

    super(opts);
    this.options = opts;

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
      'click .js-userIcon': 'onClickUserIcon',
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
    this.getCachedEl('.js-deleteConfirmedBox').removeClass('hide');
    this.deleteConfirmOn = true;
    e.stopPropagation();
  }

  onClickClone(e) {
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
    e.stopPropagation();
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;
    this.destroyRequest = this.model.destroy({ wait: true });
  }

  onClickConfirmCancel() {
    this.getCachedEl('.js-deleteConfirmedBox').addClass('hide');
    this.deleteConfirmOn = false;
  }

  onClickDeleteConfirmBox(e) {
    e.stopPropagation();
  }

  onClickUserIcon(e) {
    e.stopPropagation();
  }

  onClick(e) {
    if (this.deleteConfirmOn) return;
    const verifiedIDs = app.verifiedMods.matched(this.model.get('moderators') || []);
    if (verifiedIDs.length && $.contains(this.getCachedEl('.js-verifiedMod')[0], e.target)) return;
    if (!this.ownListing ||
        (e.target !== this.$btnEdit[0] && e.target !== this.$btnDelete[0] &&
         !$.contains(this.$btnEdit[0], e.target) && !$.contains(this.$btnDelete[0], e.target))) {
      const routeOnOpen = location.hash.slice(1);
      app.router.navigateUser(`${this.options.listingBaseUrl}${this.model.get('slug')}`,
        this.ownerGuid);

      const listingFetch = this.fetchFullListing();
      const loadListing = () => {
        app.loadingModal.open();
        listingFetch.done(jqXhr => {
          if (jqXhr.statusText === 'abort' || this.isRemoved()) return;

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

          const onListingDetailClose = () => app.router.navigate(routeOnOpen);

          this.listenTo(listingDetail, 'close', onListingDetailClose);
          this.listenTo(listingDetail, 'modal-will-remove',
            () => this.stopListening(null, null, onListingDetailClose));
        })
        .always(() => {
          if (this.isRemoved()) return;
          app.loadingModal.close();
        })
        .fail(xhr => {
          if (xhr.statusText === 'abort') return;
          app.router.listingError(xhr, this.model.get('slug'), `#${this.ownerGuid}/store`);
        });
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
        if (!opts.showErrorOnFetchFail) return;
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
    if (['list', 'grid'].indexOf(type) === -1) {
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
    if (this.fullListingFetch) this.fullListingFetch.abort();
    if (this.destroyRequest) this.destroyRequest.abort();
    $(document).off('click', this.boundDocClick);
    super.remove();
  }

  render() {
    super.render();

    loadTemplate('listingCard.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownListing: this.ownListing,
        shipsFreeToMe: this.model.shipsFreeToMe,
        viewType: this.viewType,
        displayCurrency: app.settings.get('localCurrency'),
        isBlocked,
        isUnblocking,
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
    // hide unneeded report buttons so their wrapper doesn't affect the button layout
    this.getCachedEl('.js-reportBtnWrapper').toggleClass('hide', !this.reportsUrl);

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

    if (verifiedID) {
      this.verifiedMod = new VerifiedMod({
        model: app.verifiedMods.get(verifiedID),
        data: app.verifiedMods.data,
        showLongText: true,
        genericText: true,
      });
      this.getCachedEl('.js-verifiedMod').append(this.verifiedMod.render().el);
    }

    return this;
  }
}
