import $ from 'jquery';
import app from '../app';
import loadTemplate from '../utils/loadTemplate';
import { launchEditListingModal } from '../utils/modalManager';
import Listing from '../models/listing/Listing';
import ListingShort from '../models/ListingShort';
import baseVw from './baseVw';
import ListingDetail from './modals/listingDetail/Listing';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof ListingShort)) {
      throw new Error('Please provide a ListingShort model.');
    }

    if (!options.ownListing) {
      // For search and channels this will need to be included in the API, in
      // which case, we could get the value from the model and this could
      // be completely optional.
      throw new Error('Please provide an ownListing indicator.');
    }

    if (!options.listingBaseUrl) {
      // When the listing card is clicked and the listing detail modal is
      // opened, the slug of the listing is concatenated with the listingBaseUrl
      // and the route is updated (both history & address bar).
      throw new Error('Please provide a listingBaseUrl.');
    }

    this.listenTo(this.model, 'change', this.render);

    if (this.options.ownListing) {
      this.$el.addClass('ownListing');
    }

    this.fullListingFetches = [];
  }

  className() {
    return 'col clrBr clrT clrP';
  }

  events() {
    return {
      'click .js-edit': 'onClickEdit',
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

  onClick(e) {
    // todo: Think about how we are fetching listings and how fresh they need to
    // be. We could fetch by hash here, which would be much mroe beneficial from
    // a caching perspective, but it means there's a chance the user may load a
    // non out of date version of a listing and then go through the buy process
    // only to be rejected.
    //
    // Similarly, we are now fetching the listing each time the card (or edit)
    // button is clicked. It would be much more efficient to only fetch it once
    // and then re-use the same model.
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

      this.fullListing.on('request', (md, xhr) => this.fullListingFetches.push(xhr));
    }

    return this._fullListing;
  }

  remove() {
    this.fullListingFetches.forEach(fetch => fetch.abort());
    super.remove();
  }

  get $btnEdit() {
    return this._$btnEdit ||
      (this._$btnEdit = this.$('.js-edit'));
  }

  get $btnDelete() {
    return this._$btnDelete ||
      (this._$btnDelete = this.$('.js-delete'));
  }

  render() {
    loadTemplate('listingShort.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ownListing: this.options.ownListing,
      }));
    });

    this._$btnEdit = null;
    this._$btnDelete = null;

    return this;
  }
}
