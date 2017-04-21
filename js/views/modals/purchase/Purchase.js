import $ from 'jquery';
import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import { getTranslatedCountries } from '../../../data/countries';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import PopInMessage from '../../PopInMessage';
import Moderators from './moderators';


export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing) {
      throw new Error('Please provide a listing object');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }

    super(options);
    this.options = options;
    this.listing = options.listing;
    this.variants = options.variants;
    this.vendor = options.vendor;
    this.order = new Order();
    /* to support multiple items in a purchase in the future, pass in listings in the options,
       and add them to the order as items here.
    */
    const item = new Item({
      listingHash: this.listing.hash,
      quantity: 1,
    });
    if (options.variants) item.get('options').add(options.variants);
    // add the item to the order.
    this.order.get('items').add(item);

    const fetchErrorTitle = app.polyglot.t('purchase.errors.moderatorsTitle');
    const fetchErrorMsg = app.polyglot.t('purchase.errors.moderatorsMsg');


    this.moderators = new Moderators({
      moderatorIDs: this.listing.moderators || [],
      fetchErrorTitle,
      fetchErrorMsg,
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      selectFirst: true,
    });

    this.listenTo(this.moderators, 'changeModerator', ((data) => this.changeModerator(data)));

    this.countryData = getTranslatedCountries(app.settings.get('language'))
        .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
        (cl, updateOpts) => {
          if (updateOpts.changes.added.length ||
              updateOpts.changes.removed.length) {
            // update the shipping section with the changed address information
            // TODO: add shipping code here
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
      'click #purchaseModerated': 'clickModerated',
      'click .js-payBtn': 'clickPayBtn',
      'click .js-pendingBtn': 'clickPendingBtn',
      'change #purchaseQuantity': 'changeQuantityInput',
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

  clickModerated(e) {
    const checked = $(e.target).prop('checked');
    this.$moderatorSection.toggleClass('hide', !checked);

    if (checked && this._oldMod) {
      // re-select the previously selected moderator, if any
      for (const mod of this.moderators.modCards) {
        if (mod.model.id === this._oldMod) {
          mod.changeSelectState('selected');
          break;
        }
      }
    } else {
      // deselect all the moderators after storing any selected moderator
      this._oldMod = this.order.get('moderator');
      this.moderators.deselectOthers();
      this.order.set('moderator', '');
    }
  }

  changeModerator(data) {
    if (data.selected) {
      this.order.set('moderator', data.guid);
    } else if (data.guid === this.order.get('moderator')) {
      // the current moderator was deselected
      this.order.set('moderator', '');
    }
  }

  changeQuantityInput(e) {

  }

  changeQuantity(quantity) {
  }

  clickPayBtn() {
    console.log(this.order.attributes);
  }

  clickPendingBtn() {
    console.log('clicked the pending button');
  }

  get $popInMessages() {
    return this._$popInMessages ||
        (this._$popInMessages = this.$('.js-popInMessages'));
  }

  get $storeOwnerAvatar() {
    return this._$storeOwnerAvatar ||
        (this._$storeOwnerAvatar = this.$('.js-storeOwnerAvatar'));
  }

  get $moderatorSection() {
    return this._$moderatorSection ||
        (this._$moderatorSection = this.$('.js-moderator'));
  }

  get $payBtn() {
    return this._$payBtn ||
        (this._$payBtn = this.$('.js-payBtn'));
  }

  get $pendingBtn() {
    return this._$pendingBtn ||
        (this._$pendingBtn = this.$('.js-pendingBtn'));
  }

  get $closeBtn() {
    return this._$closeBtn ||
        (this._$closeBtn = this.$('.js-closeBtn'));
  }

  remove() {
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();

    loadTemplate('modals/purchase/purchase.html', t => {
      this.$el.html(t({
        listing: this.listing.toJSON(),
        vendor: this.vendor,
        variants: this.variants,
        items: this.order.get('items').toJSON(),
        displayCurrency: app.settings.get('localCurrency'),
        countryData: this.countryData, // not used yet
        defaultCountry: this.defaultCountry, // not used yet
      }));

      super.render();

      this._$popInMessages = null;
      this._$storeOwnerAvatar = null;
      this._$moderatorSection = null;
      this._$payBtn = null;
      this._$pendingBtn = null;
      this._$closeBtn = null;

      this.$purchaseModerated = this.$('#purchaseModerated');

      // add the moderators section content
      this.$('.js-moderatorsWrapper').append(this.moderators.render().el);
      this.moderators.getModeratorsByID();
    });

    return this;
  }
}
