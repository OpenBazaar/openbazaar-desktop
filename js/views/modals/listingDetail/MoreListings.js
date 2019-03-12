import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import ListingShort from '../../../models/listing/ListingShort';
import ListingCard from '../../components/ListingCard';

export default class extends BaseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        listings: [],
        vendor: {},
        ...options.initialState,
      },
    });

    this.listingCardViews = [];
  }

  className() {
    return 'moreListings';
  }

  createListingCardView(listing) {
    const vendor = this.getState().vendor;
    const model = new ListingShort(listing);
    model.set('vendor', vendor);
    const options = {
      listingBaseUrl: `${vendor.peerID}/store/`,
      model,
      vendor,
      onStore: true,
    };

    const card = this.createChild(ListingCard, options);

    return card;
  }

  renderListingCards(listings = []) {
    const listingsFrag = document.createDocumentFragment();

    listings.forEach(listing => {
      const listingCardVw = this.createListingCardView(listing);
      this.listingCardViews.push(listingCardVw);
      listingCardVw.render().$el.appendTo(listingsFrag);
      this.listenTo(listingCardVw, 'listingDetailOpened',
        () => this.trigger('listingDetailOpened'));
    });

    this.getCachedEl('.js-cardWrapper').append(listingsFrag);
  }

  render() {
    const state = this.getState();
    this.listingCardViews.forEach(vw => vw.remove());
    this.listingCardViews = [];

    if (!state.listings || !state.listings.length) {
      this.$el.remove();
      return this;
    }

    super.render();

    loadTemplate('modals/listingDetail/moreListings.html', t => {
      this.$el.html(t(state));
      this.renderListingCards(state.listings);
    });

    return this;
  }
}
