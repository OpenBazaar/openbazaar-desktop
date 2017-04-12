import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import { getAvatarBgImage } from '../../../utils/responsive';
import { getTranslatedCountries } from '../../../data/countries';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Order from '../../../models/Order';
import PopInMessage from '../../PopInMessage';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing) {
      throw new Error('Please provide a listing model');
    }

    super(options);
    this.options = options;

    // Sometimes a profile model is available and the vendor info
    // can be obtained from that.
    if (options.profile) {
      const avatarHashes = options.profile.get('avatarHashes');

      this.vendor = {
        guid: options.profile.id,
        name: options.profile.get('name'),
        handle: options.profile.get('handle'),
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
    this.vendor = this.vendor || options.vendor;

    this.countryData = getTranslatedCountries(app.settings.get('language'))
        .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
        (cl, updateOpts) => {
          if (updateOpts.changes.added.length ||
              updateOpts.changes.removed.length) {
            // update the shipping section with the changed address information
          }
        });

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {

      ...super.events(),
    };
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      const refreshLink =
        `<a class="js-refresh">${app.polyglot.t('purchase.refreshPurchase')}</a>`;

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


  get $popInMessages() {
    return this._$popInMessages ||
        (this._$popInMessages = this.$('.js-popInMessages'));
  }

  get $storeOwnerAvatar() {
    return this._$storeOwnerAvatar ||
        (this._$storeOwnerAvatar = this.$('.js-storeOwnerAvatar'));
  }

  remove() {
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();

    loadTemplate('modals/purchase/purchase.html', t => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
        countryData: this.countryData,
        defaultCountry: this.defaultCountry,
        vendor: this.vendor,
      }));

      super.render();

      this._$popInMessages = null;
      this._$storeOwnerAvatar = null;
    });

    return this;
  }
}
