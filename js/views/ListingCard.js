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

    if (!opts.ownListing) {
      // For search and channels this will need to be included in the API, in
      // which case, we could get the value from the model and this could
      // be completely optional.
      throw new Error('Please provide an ownListing indicator.');
    }

    if (!opts.listingBaseUrl) {
      // When the listing card is clicked and the listing detail modal is
      // opened, the slug of the listing is concatenated with the listingBaseUrl
      // and the route is updated (both history & address bar).
      throw new Error('Please provide a listingBaseUrl.');
    }

    if (this.options.ownListing) {
      this.$el.addClass('ownListing');
    }

    this.fullListingFetches = [];

    if (this.options.ownListing) {
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
    return 'listingCard col clrBr clrT clrP';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
      'click .js-delete': 'onClickDelete',
      click: 'onClick',
    };
  }

  onClickEdit(e) {
    // todo: Instead of putting a spinner on the edit button, show a
    // loading modal with a cancel button. That will prevent the user
    // from being able to take other actions and queue up requests.
    $(e.target).addClass('processing');

    const fullListingFetch = this.fullListing.fetch()
      .done(() => {
        if (fullListingFetch.statusText === 'abort' || this.isRemoved()) return;

        this.editModal = launchEditListingModal({
          model: this.fullListing,
        });
      })
      .always(() => {
        if (this.isRemoved()) return;
        $(e.target).removeClass('processing');
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
    // todo: Think about how we are fetching listings and how fresh they need to
    // be. We could fetch by hash here, which would be much more beneficial from
    // a caching perspective, but it means there's a chance the user may load an
    // out of date version of a listing and then go through the buy process
    // only to be rejected.
    //
    // Boils down to, in the few minutes the user may be on the page the card is on,
    // how likely is it that the listing will change (probably not very likely) and
    // how graceful is the experience if the user goes through the buy flow on
    // an old listing.
    if (!this.options.ownListing ||
        (e.target !== this.$btnEdit[0] && e.target !== this.$btnDelete[0])) {
      // TODO: Change the loading modal from a singleton to where different
      // modules are using there own instance. With the current set-up of
      // sharing an instance, there's bound to be toe stepping.
      app.loadingModal.open();

      const fullListingFetch = this.fullListing.fetch()
        .done(() => {
          if (fullListingFetch.statusText === 'abort' || this.isRemoved()) return;

          const listingDetail = new ListingDetail({
            model: this.fullListing,
            closeButtonClass: 'cornerTR ion-ios-close-empty iconBtn clrP clrBr',
            modelContentClass: 'modalContent',
          }).render()
            .open();

          const routeOnOpen = location.hash.slice(1);
          const onListingDetailClose = () => app.router.navigate(routeOnOpen);

          this.listenTo(listingDetail, 'close', onListingDetailClose);
          this.listenTo(listingDetail, 'modal-will-remove',
            () => this.stopListening(null, null, onListingDetailClose));

          app.router.navigate(`${this.options.listingBaseUrl}${this.model.get('slug')}`);
        })
        .always(() => {
          if (this.isRemoved()) return;
          app.loadingModal.close();
        })
        .fail(() => {
          // todo: show errors;
        });
    }
  }

  get fullListing() {
    // todo: allow fullListing to be provided/retrieved externally
    if (!this._fullListing) {
      this._fullListing = new Listing({
        listing: { slug: this.model.get('slug') },
      }, {
        guid: app.profile.id,
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
        ownListing: this.options.ownListing,
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
