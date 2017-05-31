import $ from 'jquery';
import _ from 'underscore';
import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import Purchase from '../../../models/purchase/Purchase';
import PopInMessage from '../../PopInMessage';
import Moderators from './Moderators';
import Shipping from './Shipping';
import Receipt from './Receipt';
import Coupons from './Coupons';
import ActionBtn from './ActionBtn';
import Payment from './Payment';
import Complete from './Complete';
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

    const moderatorIDs = this.listing.get('moderators') || [];
    const disallowedIDs = [app.profile.id, this.listing.get('vendorID').peerID];
    this.moderatorIDs = _.without(moderatorIDs, ...disallowedIDs);

    this.order = new Order(
      {},
      {
        shippable,
        moderated: !!this.moderatorIDs && this.moderatorIDs.length,
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

    // create an empty purchase model
    this.purchase = new Purchase();

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  attributes() {
    return { 'data-phase': 'pay' };
  }

  events() {
    return {
      'click .js-goToListing': 'close',
      'click #purchaseModerated': 'clickModerated',
      'change #purchaseQuantity': 'changeQuantityInput',
      'click .js-newAddress': 'clickNewAddress',
      'click .js-applyCoupon': 'applyCoupon',
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
    this.order.moderated = checked;

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

  applyCoupon() {
    const code = this.coupons.addCode(this.$couponField.val());
    code.then(result => {
      // if the result is valid, clear the input field
      if (result.type === 'valid') {
        this.$couponField.val('');
      }
    });
  }

  onKeyUpCouponCode(e) {
    if (e.which === 13) {
      this.applyCoupon();
    }
  }

  blurEmailAddress(e) {
    this.order.set('alternateContactInfo', $(e.target).val());
  }

  blurMemo(e) {
    this.order.set('memo', $(e.target).val());
  }

  changeCoupons(hashes, codes) {
    // combine the codes and hashes so the receipt can check both.
    // if this is the user's own listing they will have codes instead of hashes
    this.receipt.coupons = hashes.concat(codes);
    this.order.get('items').at(0).set('coupons', codes);
  }

  updateShippingOption(opts) {
    // set the shipping option
    this.order.get('items').at(0).get('shipping')
      .set({ name: opts.name, service: opts.service });
    this.actionBtn.render();
  }

  updatePageState(state) {
    if (this._state !== state) {
      this._state = state;
      this.state.phase = state;
      this.$el.attr('data-phase', state);
    }
  }

  purchaseListing() {
    // clear any old errors
    const allErrContainers = this.$('div[class $="-errors"]');
    allErrContainers.each((i, container) => $(container).html(''));

    // set the shipping address if the listing is shippable
    if (this.shipping && this.shipping.selectedAddress) {
      this.order.addAddress(this.shipping.selectedAddress);
    }

    // set the moderator
    this.order.set({ moderator: this.moderators.selectedIDs[0] }, { validate: true });

    // cancel any existing order
    if (this.orderSubmit) this.orderSubmit.abort();

    if (!this.order.validationError) {
      if (this.listing.isOwnListing) {
        // don't allow a seller to buy their own items
        const errTitle = app.polyglot.t('purchase.errors.ownIDTitle');
        const errMsg = app.polyglot.t('purchase.errors.ownIDMsg');
        openSimpleMessage(errTitle, errMsg);
        this.updatePageState('pay');
        this.actionBtn.render();
      } else {
        $.post({
          url: app.getServerUrl('ob/purchase'),
          data: JSON.stringify(this.order.toJSON()),
          dataType: 'json',
          contentType: 'application/json',
        })
          .done((data) => {
            this.updatePageState('pending');
            this.actionBtn.render();
            this.purchase.set(this.purchase.parse(data));
            this.pending.render();
          })
          .fail((jqXHR) => {
            if (jqXHR.statusText === 'abort') return;
            const errMsg = jqXHR.responseJSON && jqXHR.responseJSON.reason || '';
            const errTitle = app.polyglot.t('purchase.errors.orderError');
            openSimpleMessage(errTitle, errMsg);
            this.updatePageState('pay');
            this.actionBtn.render();
          });
      }
    } else {
      Object.keys(this.order.validationError).forEach(errKey => {
        const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
        let container = this.$(`.js-${domKey}-errors`);
        // if no container exists, use the generic container
        container = container.length ? container : this.$errors;
        this.insertErrors(container, this.order.validationError[errKey]);
      });
      this.updatePageState('pay');
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

  completePurchase(data) {
    this.complete.orderID = data.orderId;
    this.complete.render();
    this.updatePageState('complete');
    this.actionBtn.render();
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

      if (this.actionBtn) this.actionBtn.remove();
      this.actionBtn = this.createChild(ActionBtn, {
        state: this.state,
        listing: this.listing,
      });
      this.listenTo(this.actionBtn, 'purchase', (() => this.purchaseListing()));
      this.listenTo(this.actionBtn, 'close', (() => this.close()));
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      if (this.receipt) this.receipt.remove();
      this.receipt = this.createChild(Receipt, {
        model: this.order,
        listing: this.listing,
      });
      this.$('.js-receipt').append(this.receipt.render().el);

      if (this.coupons) this.coupons.remove();
      const couponList = this.listing.get('coupons');
      if (couponList) {
        this.coupons = this.createChild(Coupons, {
          coupons: couponList,
          listingPrice: this.listing.get('item').get('price'),
        });
        this.listenTo(this.coupons, 'changeCoupons',
          (hashes, codes) => this.changeCoupons(hashes, codes));
        this.$('.js-couponsWrapper').html(this.coupons.render().el);
      }

      if (this.moderators) this.moderators.remove();
      this.moderators = this.createChild(Moderators, {
        moderatorIDs: this.moderatorIDs,
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

      if (this.listing.get('shippingOptions').length) {
        if (this.shipping) this.shipping.remove();
        this.shipping = this.createChild(Shipping, {
          model: this.listing,
        });
        this.listenTo(this.shipping, 'shippingOptionSelected', ((opts) => {
          this.updateShippingOption(opts);
        }));
        this.$('.js-shippingWrapper').append(this.shipping.render().el);
      }

      // remove old view if any on render
      if (this.pending) this.pending.remove();
      // add the pending view
      this.pending = this.createChild(Payment, {
        model: this.purchase,
      });
      this.listenTo(this.pending, 'walletPaymentComplete', (data => this.completePurchase(data)));
      this.$('.js-pending').append(this.pending.render().el);

      // remove old view if any on render
      if (this.complete) this.complete.remove();
      // add the complete view
      this.complete = this.createChild(Complete, {
        listing: this.listing,
        vendor: this.vendor,
      });
      this.$('.js-complete').append(this.complete.render().el);
    });

    return this;
  }
}
