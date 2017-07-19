import $ from 'jquery';
import app from '../app';
import loadTemplate from '../utils/loadTemplate';
import { launchEditListingModal } from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import ListingShort from '../models/listing/ListingShort';
import { events as listingEvents } from '../models/listing/';
import baseVw from './baseVw';
import ListingDetail from './modals/listingDetail/Listing';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      viewType: 'grid',
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

    this.fullListingFetches = [];

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
      click: 'onClick',
    };
  }

  onClickEdit() {
    app.loadingModal.open();

    const fullListingFetch = this.fullListing.fetch()
      .done(() => {
        if (fullListingFetch.statusText === 'abort' || this.isRemoved()) return;

        this.editModal = launchEditListingModal({
          model: this.fullListing,
        });
      })
      .always(() => {
        if (this.isRemoved()) return;
        app.loadingModal.close();
      })
      .fail(() => {
        // todo: show errors;
      });
  }

  onClickDelete() {
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;

    this.destroyRequest = this.model.destroy({ wait: true });
  }

  onClick(e) {
    if (!this.ownListing ||
        (e.target !== this.$btnEdit[0] && e.target !== this.$btnDelete[0] &&
         !$.contains(this.$btnEdit[0], e.target) && !$.contains(this.$btnDelete[0], e.target))) {
      const routeOnOpen = location.hash.slice(1);
      app.router.navigateUser(`${this.options.listingBaseUrl}${this.model.get('slug')}`,
        this.ownerGuid);

      // todo: show a cancel button on the loading modal so the user could
      // cancel the loading. As of now, the user can still cancel by hitting
      // back, but that will go through the router and reload the whole
      // page (e.g. the store) the user had been on.
      app.loadingModal.open();

      const fullListingFetch = this.fullListing.fetch()
        .done(jqXhr => {
          if (jqXhr.statusText === 'abort' || this.isRemoved()) return;

          const listingDetail = new ListingDetail({
            model: this.fullListing,
            profile: this.options.profile,
            vendor: this.options.vendor,
            closeButtonClass: 'cornerTR ion-ios-close-empty iconBtn clrP clrBr clrSh3',
            modelContentClass: 'modalContent',
            openedFromStore: !!this.options.onStore,
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
        .fail((xhr) => {
          // todo todo todo - test me. no trigger?
          app.router.listingError(xhr, this.model.get('slug'), `#${this.ownerGuid}/store`);
        });

      this.fullListingFetches.push(fullListingFetch);
    }
  }

  get ownListing() {
    return app.profile.id === this.ownerGuid;
  }

  get fullListing() {
    // todo: allow fullListing to be provided/retrieved externally
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
    this.fullListingFetches.forEach(fetch => fetch.abort());
    if (this.destroyRequest) this.destroyRequest.abort();
    super.remove();
  }

  render() {
    loadTemplate('listingCard.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownListing: this.ownListing,
        shipsFreeToMe: this.model.shipsFreeToMe,
        viewType: this.viewType,
        displayCurrency: app.settings.get('localCurrency'),
      }));
    });

    this._$btnEdit = null;
    this._$btnDelete = null;

    return this;
  }
}
