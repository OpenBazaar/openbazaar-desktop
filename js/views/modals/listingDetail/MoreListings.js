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
    console.log(model.toJSON())
    const options = {
      listingBaseUrl: `${this.options.vendor.peerID}/store/`,
      viewType: 'grid',
      model,
      vendor: this.options.vendor,
      onStore: true,
      ownerGuid: this.options.vendor.peerID,
    };

    return this.createChild(ListingCard, options);
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

    console.log(listingsFrag)
    this.getCachedEl('.js-cardWrapper').append(listingsFrag);
  }
  render() {
    // Don't show anything if there are no listings to show, or if the only
    // listing is the same as the parent listing.
    console.log(this.collection.length)
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

    console.log('foo')

    return this;
  }
/*
  render() {
    // Don't show anything if there are no listings to show
    console.log(this.collection.length)
    if (this.collection.length < 1) return this;

    super.render();

    loadTemplate('modals/listingDetail/rating.html', t => {
      this.$el.html(t({
        name: this.options.ownerName,
      }));

      console.log('foo')

      this.listingCardViews.forEach(vw => vw.remove());
      this.listingCardViews = [];
      this.$el.empty();
      // Render only the first 8 cards maximum
      this.renderListingCards(this.collection.first(8));
    });

    return this;
  }
  */
}
