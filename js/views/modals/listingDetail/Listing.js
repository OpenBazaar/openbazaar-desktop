import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import { events as listingEvents } from '../../../models/listing/';
import BaseModal from '../BaseModal';
import PopInMessage from '../../PopInMessage';
import 'select2';
import { getTranslatedCountries } from '../../../data/countries';
import '../../../utils/draggable_background';


export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: false,
      ...options,
    };

    super(opts);
    this.options = opts;
    this._shipsFreeToMe = this.model.shipsFreeToMe;

    this.select2CountryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));

    this.listenTo(app.settings, 'change:country', () =>
      (this.shipsFreeToMe = this.model.shipsFreeToMe));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, updateOpts) => {
        if (updateOpts.changes.added.length ||
          updateOpts.changes.removed.length) {
          this.shipsFreeToMe = this.model.shipsFreeToMe;
        }
      });

    if (this.model.isOwnListing) {
      this.listenTo(listingEvents, 'saved', (md, savedOpts) => {
        const slug = this.model.get('listing')
          .get('slug');

        if (savedOpts.slug === slug && savedOpts.hasChanged()) {
          this.showDataChangedMessage();
        }
      });
    }
  }

  className() {
    return `${super.className()} listingDetail modalScrollPage modalTop`;
  }

  events() {
    return {
      'click .js-editListing': 'onClickEditListing',
      'click .js-deleteListing': 'onClickDeleteListing',
      'click .js-gotoPhotos': 'onClickGotoPhotos',
      'click .js-freeShippingLabel': 'onClickFreeShippingLabel',
      'change #shippingDestinations': 'setShippingDestination',
      'click .js-photoSelect': 'onClickPhotoSelect',
      ...super.events(),
    };
  }

  onClickEditListing() {
    this.editModal = launchEditListingModal({
      model: this.model,
      returnText: app.polyglot.t('listingDetail.editListingReturnText'),
    });

    this.$el.addClass('hide');

    const onCloseEditModal = () => {
      this.close();

      if (!this.isRemoved()) {
        this.$el.removeClass('hide');
      }
    };

    this.listenTo(this.editModal, 'close', onCloseEditModal);

    const onEditModalClickReturn = () => {
      this.stopListening(null, null, onCloseEditModal);
      this.editModal.remove();
      this.$el.removeClass('hide');
    };

    this.listenTo(this.editModal, 'click-return', onEditModalClickReturn);
  }

  onClickDeleteListing() {
    if (this.destroyRequest && this.destroyRequest.state === 'pending') return;

    this.destroyRequest = this.model.destroy({ wait: true });

    if (this.destroyRequest) {
      this.$deleteListing.addClass('processing');

      this.destroyRequest.done(() => {
        if (this.destroyRequest.statusText === 'abort' ||
          this.isRemoved()) return;

        this.close();
      }).always(() => {
        if (!this.isRemoved()) {
          this.$deleteListing.removeClass('processing');
        }
      });
    }
  }

  onClickGotoPhotos() {
    this.gotoPhotos();
  }

  gotoPhotos() {
    this.$el.animate({
      scrollTop: this.$photoSection.offset().top,
    }, 500);
  }

  onClickPhotoSelect(e) {
    this.setSelectedPhoto($(e.target).data('index'));
  }

  setSelectedPhoto(photoIndex) {
    const photoHash = this.model.get('listing').toJSON().item.images[photoIndex].original;
    const phSrc = app.getServerUrl(`ipfs/${photoHash}`);
    this.$photoSelected.attr('style', `background-image: url(${phSrc});`);
  }


  onClickFreeShippingLabel() {
    this.gotoShippingOptions();
  }

  gotoShippingOptions() {
    this.$el.animate({
      scrollTop: this.$shippingOptions.offset().top,
    }, 500);
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      const refreshLink =
        `<a class="js-refresh">${app.polyglot.t('listingDetail.listingDataChangedPopinRefresh')}` +
        '</a>';

      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText: app.polyglot.t('listingDetail.listingDataChangedPopin',
          { refreshLink }),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.render()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  setShippingDestination(e) {
    const shippingOptions = this.model.get('listing').get('shippingOptions').toJSON();
    const templateData = shippingOptions.filter((option) =>
      option.regions.includes($(e.target).val())
    );
    loadTemplate('modals/listingDetail/shippingOptions.html', t => {
      this.$shippingOptions.html(t({
        templateData,
        displayCurrency: app.settings.get('localCurrency'),
        pricingCurrency: this.model.get('listing').get('metadata').get('pricingCurrency'),
      }));
    });
  }

  get shipsFreeToMe() {
    return this._shipsFreeToMe;
  }

  set shipsFreeToMe(shipsFree) {
    const prevVal = this._shipsFreeToMe;
    this._shipsFreeToMe = !!shipsFree;

    if (prevVal !== this._shipsFreeToMe) {
      this.$shipsFreeBanner[this._shipsFreeToMe ? 'removeClass' : 'addClass']('hide');
    }
  }

  get $deleteListing() {
    return this._$deleteListing || this.$('.js-deleteListing');
  }

  get $shipsFreeBanner() {
    return this._$shipsFreeBanner || this.$('.js-shipsFreeBanner');
  }

  get $popInMessages() {
    return this._$popInMessages ||
      (this._$popInMessages = this.$('.js-popInMessages'));
  }

  get $photoSection() {
    return this._$photoSection ||
      (this._$photoSection = this.$('#photoSection'));
  }

  get $shippingOptions() {
    return this._$shippingOptions ||
      (this._$shippingOptions = this.$('.js-shippingOptions'));
  }

  remove() {
    if (this.editModal) this.editModal.remove();
    if (this.destroyRequest) this.destroyRequest.abort();
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();

    loadTemplate('modals/listingDetail/listing.html', t => {
      this.$el.html(t({
        ...this.model.get('listing').toJSON(),
        shipsFreeToMe: this.shipsFreeToMe,
        ownListing: this.model.isOwnListing,
        displayCurrency: app.settings.get('localCurrency'),
        shipsFromCountry: app.settings.get('country'),
      }));

      super.render();

      this._$deleteListing = null;
      this._$shipsFreeBanner = null;
      this._$popInMessages = null;
      this._$photoSection = null;

      // commented out until variants are available
      // this.$('.js-variantSelect').select2();

      this.$photoSelected = this.$('.js-photoSelected');
      this.$photoSelected.backgroundDraggable();

      const shippingDest = this.$('#shippingDestinations');

      shippingDest.select2({
        data: this.select2CountryData,
        placeholder: app.polyglot.t('listingDetail.shipToPlaceholder'),
      });

      shippingDest.val(app.settings.get('country')).trigger('change');
    });

    return this;
  }
}
