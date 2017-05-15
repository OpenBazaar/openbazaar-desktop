import $ from 'jquery';
import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import PopInMessage from '../../PopInMessage';
import Moderators from './Moderators';
import Shipping from './Shipping';
import Receipt from './Receipt';
import Coupons from './Coupons';
import ActionBtn from './ActionBtn';
import { launchSettingsModal } from '../../../utils/modalManager';
import { openSimpleMessage } from '../SimpleMessage';


export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }

    super(options);
    this.options = options;
    this.state = { phase: 'pay' };
    this.listing = options.listing;
    this.variants = options.variants;
    this.vendor = options.vendor;

    const shippingOptions = this.listing.get('shippingOptions');
    const shippable = !!(shippingOptions && shippingOptions.length);
    this.order = new Order(
      {},
      {
        shippable,
      });
    /* to support multiple items in a purchase in the future, pass in listings in the options,
       and add them to the order as items here.
    */
    const item = new Item(
      {
        listingHash: this.listing.get('hash'),
        quantity: 1,
      },
      {
        shippable,
      });
    if (options.variants) item.get('options').add(options.variants);
    // add the item to the order.
    this.order.get('items').add(item);

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {
      'click .js-goToListing': 'close',
      'click #purchaseModerated': 'clickModerated',
      'change #purchaseQuantity': 'changeQuantityInput',
      'click .js-newAddress': 'clickNewAddress',
      'click .js-applyCoupon': 'clickApplyCoupon',
      'keyup #couponCode': 'onKeyUpCouponCode',
      'blur #emailAddress': 'blurEmailAddress',
      'blur #memo': 'blurMemo',
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
        messageText: app.polyglot.t('purchase.purchaseDataChangedPopin',
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
    this.$moderatorNote.toggleClass('hide', !checked);

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

  changeQuantityInput(e) {
    this.order.get('items').at(0).set(this.getFormData($(e.target)));
  }

  clickNewAddress() {
    launchSettingsModal({ initTab: 'Addresses' });
  }

  clickApplyCoupon() {
    this.coupons.addCode(this.$couponField.val());
  }

  onKeyUpCouponCode(e) {
    if (e.which === 13) {
      this.coupons.addCode(this.$couponField.val());
    }
  }

  blurEmailAddress(e) {
    this.order.set('alternateContactInfo', $(e.target).val());
  }

  blurMemo(e) {
    this.order.set('memo', $(e.target).val());
  }

  changeCoupons() {
    this.receipt.coupons = this.coupons.couponHashes;
    this.order.get('items').at(0).set('coupons', this.coupons.couponCodes);
  }

  updateShippingOption(opts) {
    // set the shipping option
    this.order.get('items').at(0).get('shipping')
      .set({ name: opts.name, service: opts.service });
    this.actionBtn.render();
  }

  purchaseListing() {
    // clear any old errors
    const allErrContainers = this.$('div[class $="-errors"]');
    allErrContainers.html('');

    // set the shipping address if the listing is shippable
    if (this.shipping && this.shipping.selectedAddress) {
      this.order.addAddress(this.shipping.selectedAddress);
    }

    // set the moderator
    this.order.set({ moderator: this.moderators.selectedIDs[0] }, { validate: true });

    // cancel any existing order
    if (this.orderSubmit) this.orderSubmit.abort();

    if (!this.order.validationError) {
      $.post({
        url: app.getServerUrl('ob/purchase'),
        data: JSON.stringify(this.order.toJSON()),
        dataType: 'json',
        contentType: 'application/json',
      })
        .done((data) => {
          this.state.phase = 'pending';
          this.actionBtn.render();
          console.log(data);
        })
        .fail((jqXHR) => {
          const errMsg = jqXHR.responseJSON ? jqXHR.responseJSON.reason : '';
          const errTitle = app.polyglot.t('purchase.errors.orderError');
          openSimpleMessage(errTitle, errMsg);
          this.state.phase = 'pay';
          this.actionBtn.render();
        });
    } else {
      Object.keys(this.order.validationError).forEach(errKey => {
        const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
        let container = this.$(`.js-${domKey}-errors`);
        // if no container exists, use the generic container
        container = container.length ? container : this.$errors;
        this.insertErrors(container, this.order.validationError[errKey]);
      });
      this.state.phase = 'pay';
      this.actionBtn.render();
    }
  }

  insertErrors(container, errors = []) {
    loadTemplate('formError.html', t => {
      container.html(t({
        errors,
      }));
    });
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

  get $moderatorNote() {
    return this._$moderatorNote ||
      (this._$moderatorNote = this.$('.js-moderatorNote'));
  }

  get $closeBtn() {
    return this._$closeBtn ||
        (this._$closeBtn = this.$('.js-closeBtn'));
  }

  get $shippingErrors() {
    return this._$shipingErrors ||
      (this._$shippingErrors = this.$('.js-shipping-errors'));
  }

  get $errors() {
    return this._$errors ||
      (this._$errors = this.$('.js-errors'));
  }

  get $couponField() {
    return this._$couponField ||
      (this._$couponField = this.$('#couponCode'));
  }

  remove() {
    if (this.orderSubmit) this.orderSubmit.abort();
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
        phase: this.state.phase,
        ...this.order.toJSON(),
      }));

      super.render();

      this._$popInMessages = null;
      this._$storeOwnerAvatar = null;
      this._$moderatorSection = null;
      this._$closeBtn = null;
      this._$shippingErrors = null;
      this._$errors = null;
      this._$couponField = null;

      this.$purchaseModerated = this.$('#purchaseModerated');

      // remove old view if any on render
      if (this.actionBtn) this.actionBtn.remove();
      // add the action button
      this.actionBtn = this.createChild(ActionBtn, {
        state: this.state,
        listing: this.listing,
      });
      this.listenTo(this.actionBtn, 'purchase', (() => this.purchaseListing()));
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      // remove old view if any on render
      if (this.receipt) this.receipt.remove();
      // add the receipt section
      this.receipt = this.createChild(Receipt, {
        model: this.order,
        listing: this.listing,
      });
      this.$('.js-receipt').append(this.receipt.render().el);

      // remove old view if any on render
      if (this.coupons) this.coupons.remove();
      // add the coupons
      this.coupons = this.createChild(Coupons, {
        coupons: this.listing.get('coupons'),
        listingPrice: this.listing.get('item').get('price'),
      });

      this.listenTo(this.coupons, 'changeCoupons', () => this.changeCoupons());
      this.$('.js-couponsWrapper').html(this.coupons.render().el);

      // remove old view if any on render
      if (this.moderators) this.moderators.remove();
      // add the moderators section content
      this.moderators = this.createChild(Moderators, {
        moderatorIDs: this.listing.get('moderators') || [],
        fetchErrorTitle: app.polyglot.t('purchase.errors.moderatorsTitle'),
        fetchErrorMsg: app.polyglot.t('purchase.errors.moderatorsMsg'),
        purchase: true,
        cardState: 'unselected',
        notSelected: 'unselected',
        singleSelect: true,
        selectFirst: true,
      });
      this.$('.js-moderatorsWrapper').append(this.moderators.render().el);
      this.moderators.getModeratorsByID();

      // add the shipping section if needed
      if (this.listing.get('shippingOptions').length) {
        // remove old view if any on render
        if (this.shipping) this.shipping.remove();
        this.shipping = this.createChild(Shipping, {
          model: this.listing,
        });
        this.listenTo(this.shipping, 'shippingOptionSelected', ((opts) => {
          this.updateShippingOption(opts);
        }));
        this.$('.js-shippingWrapper').append(this.shipping.render().el);
      }
    });

    return this;
  }
}
