import BaseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import ListingCard from '../../ListingCard';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object.');
    }

    if (!options.vendor.peerID) {
      throw new Error('Please provide a vendor peerID.');
    }

    if (!options.vendor.name) {
      throw new Error('Please provide a vendor name');
    }

    this.listingCardViews = [];

    this.listenTo(this.collection, 'update', () => {
      this.render();
    });
  }

  className() {
    return 'moreListings';
  }

  isParent(hash) {
    return hash === this.options.parentListingHash;
  }

  createListingCardView(model) {
    const options = {
      listingBaseUrl: `${this.options.vendor.peerID}/store/`,
      viewType: 'grid',
      model,
      vendor: this.options.vendor,
      onStore: true,
      ownerGuid: this.options.vendor.peerID,
      listings: this.collection,
    };

    const card = this.createChild(ListingCard, options);
    this.listenTo(card, 'cardOpened', () => this.trigger('cardOpened'));

    return card;
  }

  renderListingCards(models = []) {
    const listingsFrag = document.createDocumentFragment();

    models.forEach(model => {
      // Add up to 8 models.
      // If a parent hash was provided, don't add that model.
      if (this.listingCardViews.length < 8 &&
        !this.isParent(model.get('hash'))) {
        const listingCardVw = this.createListingCardView(model);
        this.listingCardViews.push(listingCardVw);
        listingCardVw.render().$el.appendTo(listingsFrag);
      }
    });

    this.getCachedEl('.js-cardWrapper').append(listingsFrag);
  }

  render() {
    // Don't show anything if there are no listings to show, or if the only
    // listing is the same as the parent listing.
    if (this.collection.length < 1 ||
      this.collection.length === 1 &&
      this.isParent(this.collection.at(0).get('hash'))) return this;

    super.render();
    loadTemplate('modals/listingDetail/moreListings.html', t => {
      this.$el.html(t({
        name: this.options.vendor.name,
      }));
      this.listingCardViews.forEach(vw => vw.remove());
      this.listingCardViews = [];
      this.renderListingCards(this.collection);
    });

    return this;
  }
}
