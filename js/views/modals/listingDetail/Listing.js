import $ from 'jquery';
import '../../../lib/select2';
import is from 'is_js';
import '../../../utils/velocity';
import 'jquery-zoom';
import app from '../../../app';
import { getAvatarBgImage } from '../../../utils/responsive';
import { getTranslatedCountries } from '../../../data/countries';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import { events as listingEvents } from '../../../models/listing/';
import BaseModal from '../BaseModal';
import PopInMessage from '../../PopInMessage';

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
    this.activePhotoIndex = 0;

    // Sometimes a profile model is available and the vendor info
    // can be obtained from that.
    if (opts.profile) {
      const avatarHashes = opts.profile.get('avatarHashes');

      this.vendor = {
        guid: opts.profile.id,
        name: opts.profile.get('name'),
        handle: opts.profile.get('handle'),
        avatar: {
          tiny: avatarHashes.get('tiny'),
          small: avatarHashes.get('small'),
        },
      };
    }

    // In most cases the page opening this modal will already have and be able
    // to provide the vendor information. If it cannot, then I suppose we
    // could fetch the profile and lazy load it in, but we can cross that
    // bridge when we get to it.
    this.vendor = this.vendor || opts.vendor;

    this.countryData = getTranslatedCountries(app.settings.get('language'))
      .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));

    this.defaultCountry = app.settings.get('shippingAddresses').length ?
      app.settings.get('shippingAddresses').at(0).get('country') : app.settings.get('country');

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
        const slug = this.model.get('slug');

        if (savedOpts.slug === slug && savedOpts.hasChanged()) {
          this.showDataChangedMessage();
        }
      });

      this.listenTo(app.profile.get('avatarHashes'), 'change', () => {
        this.$storeOwnerAvatar
          .attr('style', getAvatarBgImage(app.profile.get('avatarHashes').toJSON()));
      });

      this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
      this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
    }
  }

  className() {
    return `${super.className()} listingDetail modalScrollPage`;
  }

  events() {
    return {
      'click .js-editListing': 'onClickEditListing',
      'click .js-deleteListing': 'onClickDeleteListing',
      'click .js-gotoPhotos': 'onClickGotoPhotos',
      'click .js-freeShippingLabel': 'onClickFreeShippingLabel',
      'change #shippingDestinations': 'onSetShippingDestination',
      'click .js-photoSelect': 'onClickPhotoSelect',
      'click .js-photoPrev': 'onClickPhotoPrev',
      'click .js-photoNext': 'onClickPhotoNext',
      'click .js-goToStore': 'onClickGoToStore',
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

  onClickGoToStore() {
    if (this.options.openedFromStore) {
      this.close();
    } else {
      if (this.vendor.handle) {
        location.hash = `#@${this.vendor.handle}/store`;
      } else {
        location.hash = `#${this.vendor.guid}/store`;
      }
    }
  }

  gotoPhotos() {
    this.$photoSection.velocity(
      'scroll',
      {
        duration: 500,
        easing: 'easeOutSine',
        container: this.$el,
      });
  }

  onClickPhotoSelect(e) {
    this.setSelectedPhoto($(e.target).index('.js-photoSelect'));
  }

  setSelectedPhoto(photoIndex) {
    if (is.not.number(photoIndex)) {
      throw new Error('Please provide an index for the selected photo.');
    }
    if (photoIndex < 0) {
      throw new Error('Please provide a valid index for the selected photo.');
    }
    const photoCol = this.model.toJSON().item.images;
    const photoHash = photoCol[photoIndex].original;
    const phSrc = app.getServerUrl(`ipfs/${photoHash}`);

    this.activePhotoIndex = photoIndex;
    this.$photoSelected.trigger('zoom.destroy'); // old zoom must be removed
    this.$photoSelectedInner.attr('src', phSrc);
  }

  activateZoom() {
    if (this.$photoSelectedInner.width() >= this.$photoSelected.width() ||
        this.$photoSelectedInner.height() >= this.$photoSelected.height()) {
      this.$photoSelected
          .removeClass('unzoomable')
          .zoom({
            url: this.$photoSelectedInner.attr('src'),
            on: 'click',
            onZoomIn: () => {
              this.$photoSelected.addClass('open');
            },
            onZoomOut: () => {
              this.$photoSelected.removeClass('open');
            },
          });
    } else {
      this.$photoSelected.addClass('unzoomable');
    }
  }

  setActivePhotoThumbnail(thumbIndex) {
    if (is.not.number(thumbIndex)) {
      throw new Error('Please provide an index for the selected photo thumbnail.');
    }
    if (thumbIndex < 0) {
      throw new Error('Please provide a valid index for the selected photo thumbnail.');
    }
    this.$photoRadioBtns.prop('checked', false).eq(thumbIndex).prop('checked', true);
  }

  onClickPhotoPrev() {
    let targetIndex = this.activePhotoIndex - 1;
    const imagesLength = parseInt(this.model.toJSON().item.images.length, 10);

    targetIndex = targetIndex < 0 ? imagesLength - 1 : targetIndex;
    this.setSelectedPhoto(targetIndex);
    this.setActivePhotoThumbnail(targetIndex);
  }

  onClickPhotoNext() {
    let targetIndex = this.activePhotoIndex + 1;
    const imagesLength = parseInt(this.model.toJSON().item.images.length, 10);

    targetIndex = targetIndex >= imagesLength ? 0 : targetIndex;
    this.setSelectedPhoto(targetIndex);
    this.setActivePhotoThumbnail(targetIndex);
  }

  onClickFreeShippingLabel() {
    this.gotoShippingOptions();
  }

  gotoShippingOptions() {
    this.$shippingSection.velocity(
      'scroll',
      {
        duration: 500,
        easing: 'easeOutSine',
        container: this.$el,
      });
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

  onSetShippingDestination(e) {
    this.renderShippingDestinations($(e.target).val());
  }

  renderShippingDestinations(destination) {
    if (!destination) {
      throw new Error('Please provide a destination.');
    }
    const shippingOptions = this.model.get('shippingOptions').toJSON();
    const templateData = shippingOptions.filter((option) => {
      if (destination === 'ALL') return option.regions;
      return option.regions.includes(destination);
    });
    loadTemplate('modals/listingDetail/shippingOptions.html', t => {
      this.$shippingOptions.html(t({
        templateData,
        displayCurrency: app.settings.get('localCurrency'),
        pricingCurrency: this.model.get('metadata').get('pricingCurrency'),
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
      (this._$photoSection = this.$('.js-photoSection'));
  }

  get $photoSelected() {
    return this._$photoSelected ||
      (this._$photoSelected = this.$('.js-photoSelected'));
  }

  get $shippingSection() {
    return this._$shippingSection ||
      (this._$shippingSection = this.$('#shippingSection'));
  }

  get $shippingOptions() {
    return this._$shippingOptions ||
      (this._$shippingOptions = this.$('.js-shippingOptions'));
  }

  get $photoRadioBtns() {
    return this._$photoRadioBtns ||
      (this._$photoRadioBtns = this.$('.js-photoSelect'));
  }

  get $storeOwnerAvatar() {
    return this._$storeOwnerAvatar ||
      (this._$storeOwnerAvatar = this.$('.js-storeOwnerAvatar'));
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
        ...this.model.toJSON(),
        shipsFreeToMe: this.shipsFreeToMe,
        ownListing: this.model.isOwnListing,
        displayCurrency: app.settings.get('localCurrency'),
        // the ships from data doesn't exist yet
        // shipsFromCountry: this.model.get('shipsFrom');
        countryData: this.countryData,
        defaultCountry: this.defaultCountry,
        vendor: this.vendor,
        openedFromStore: this.options.openedFromStore,
      }));

      super.render();

      this.$photoSelectedInner = this.$('.js-photoSelectedInner');
      this._$deleteListing = null;
      this._$shipsFreeBanner = null;
      this._$popInMessages = null;
      this._$photoSection = null;
      this._$photoSelected = null;
      this._$shippingOptions = null;
      this._$photoRadioBtns = null;
      this._$shippingSection = null;
      this._$storeOwnerAvatar = null;

      this.$photoSelectedInner.on('load', () => this.activateZoom());

      // commented out until variants are available
      // this.$('.js-variantSelect').select2();

      this.$('#shippingDestinations').select2();
      this.renderShippingDestinations(this.defaultCountry);
      this.setSelectedPhoto(this.activePhotoIndex);
      this.setActivePhotoThumbnail(this.activePhotoIndex);
    });

    return this;
  }
}
