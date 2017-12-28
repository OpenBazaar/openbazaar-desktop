import $ from 'jquery';
import _ from 'underscore';
import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchSettingsModal } from '../../../utils/modalManager';
import { convertCurrency } from '../../../utils/currency';
import { getServerCurrency } from '../../../data/cryptoCurrencies';
import { openSimpleMessage } from '../SimpleMessage';
import BaseModal from '../BaseModal';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import Purchase from '../../../models/purchase/Purchase';
import PopInMessage, { buildRefreshAlertMessage } from '../../components/PopInMessage';
import Moderators from './Moderators';
import Shipping from './Shipping';
import Receipt from './Receipt';
import Coupons from './Coupons';
import ActionBtn from './ActionBtn';
import Payment from './Payment';
import Complete from './Complete';
import FeeChange from '../../components/FeeChange';


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

    this.couponObj = [];

    this.order = new Order(
      {},
      {
        shippable,
        moderated: !!(this.moderatorIDs && this.moderatorIDs.length),
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

    this.actionBtn = this.createChild(ActionBtn, {
      state: this.state,
      listing: this.listing,
    });
    this.listenTo(this.actionBtn, 'purchase', (() => this.purchaseListing()));
    this.listenTo(this.actionBtn, 'close', (() => this.close()));

    this.receipt = this.createChild(Receipt, {
      model: this.order,
      listing: this.listing,
      prices: this.prices,
      couponObj: this.couponObj,
    });

    this.coupons = this.createChild(Coupons, {
      coupons: this.listing.get('coupons'),
      listingPrice: this.listing.get('item').get('price'),
    });
    this.listenTo(this.coupons, 'changeCoupons',
      (hashes, codes) => this.changeCoupons(hashes, codes));

    this.moderators = this.createChild(Moderators, {
      moderatorIDs: this.moderatorIDs,
      fetchErrorTitle: app.polyglot.t('purchase.errors.moderatorsTitle'),
      fetchErrorMsg: app.polyglot.t('purchase.errors.moderatorsMsg'),
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      selectFirst: true,
      radioStyle: true,
    });
    this.listenTo(this.moderators, 'noValidModerators', () => this.onNoValidModerators());

    if (this.listing.get('shippingOptions').length) {
      this.shipping = this.createChild(Shipping, {
        model: this.listing,
      });
      this.listenTo(this.shipping, 'shippingOptionSelected', ((opts) => {
        this.updateShippingOption(opts);
      }));
    }

    this.complete = this.createChild(Complete, {
      listing: this.listing,
      vendor: this.vendor,
    });

    // on the initial load, fetch the fees
    this.getFees();

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
    this.listenTo(this.order.get('items').at(0), 'someChange ', () => this.refreshPrices());
    this.listenTo(this.order.get('items').at(0).get('shipping'), 'change', () =>
      this.refreshPrices());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  attributes() {
    return { 'data-phase': 'pay' };
  }

  events() {
    return {
      'click .js-goToListing': 'clickGoToListing',
      'click .js-close': 'clickClose',
      'click .js-retryFee': 'clickRetryFee',
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
      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('purchase.purchaseDataChangedPopin')),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.render()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  getFees() {
    if (this.fetchFees && this.fetchFees.state() === 'pending') {
      return this.fetchFees;
    }

    this.fetchFees = $.get({
      url: app.getServerUrl('wallet/fees'),
      dataType: 'json',
    })
      .done((data, status, xhr) => {
        if (xhr.statusText === 'abort') return;
        const feePerByte = data[app.localSettings.get('defaultTransactionFee').toLowerCase()];
        const serverCurrency = getServerCurrency();
        const estFee = feePerByte *
          serverCurrency.averageModeratedTransactionSize / serverCurrency.baseUnit;
        this.minModPrice = estFee * 10;
        this.setState({
          isFetching: false,
          fetchError: false,
          fetchFailed: false,
        });
      })
      .fail(xhr => {
        if (xhr.statusText === 'abort') return;
        this.setState({
          isFetching: false,
          fetchError: xhr.responseJSON && xhr.responseJSON.reason || '',
          fetchFailed: true,
        });
      });

    return this.fetchFees;
  }

  clickRetryFee() {
    this.getFees();
  }

  goToListing() {
    app.router.navigate(`${this.vendor.peerID}/store/${this.listing.get('slug')}`,
      { trigger: true });
    this.close();
  }

  clickGoToListing() {
    this.goToListing();
  }

  clickClose() {
    this.trigger('closeBtnPressed');
    this.close();
  }

  clickModerated(e) {
    const checked = $(e.target).prop('checked');
    this.getCachedEl('.js-moderator').toggleClass('hide', !checked);
    this.getCachedEl('.js-moderatorNote').toggleClass('hide', !checked);
    this.order.moderated = checked;

    if (checked) {
      // re-select the previously selected moderator, if any
      for (const mod of this.moderators.modCards) {
        if (mod.model.id === this._oldMod || this.moderators.selectedIDs[0]) {
          mod.changeSelectState('selected');
          break;
        }
      }
    } else {
      // deselect all the moderators after storing any selected moderator
      this._oldMod = this.moderators.selectedIDs[0];
      this.moderators.noneSelected = true;
      this.moderators.deselectOthers();
      this.order.set('moderator', '');
    }
  }

  disableModerators() {
    this.getCachedEl('#purchaseModerated').prop('checked', false);
    this.moderators.deselectOthers();
    this.order.set('moderator', '');
  }

  moderationOn(bool) {
    this.getCachedEl('.js-moderatedOption').toggleClass('disabled', !bool);
    this.getCachedEl('.js-moderator').toggleClass('hide', !bool);
    this.getCachedEl('.js-moderatorNote').toggleClass('hide', !bool);
    if (!bool) this.disableModerators();
    this.order.moderated = bool;
    this.getCachedEl('#purchaseModerated').prop('checked', bool);
    this.moderators.noneSelected = !bool;
  }

  onNoValidModerators() {
    this.moderationOn(false);
    this.getCachedEl('.js-noValidModerators').removeClass('hide');
  }

  changeQuantityInput(e) {
    this.order.get('items').at(0).set(this.getFormData($(e.target)));
  }

  clickNewAddress() {
    launchSettingsModal({ initialTab: 'Addresses' });
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
    this.order.get('items').at(0).set('memo', $(e.target).val());
  }

  changeCoupons(hashes, codes) {
    // combine the codes and hashes so the receipt can check both.
    // if this is the user's own listing they will have codes instead of hashes
    const hashesAndCodes = hashes.concat(codes);
    const filteredCoupons = this.listing.get('coupons').filter((coupon) =>
      hashesAndCodes.indexOf(coupon.get('hash') || coupon.get('discountCode')) !== -1);
    this.couponObj = filteredCoupons.map(coupon => coupon.toJSON());
    this.receipt.coupons = this.couponObj;
    this.order.get('items').at(0).set('coupons', codes);
  }

  updateShippingOption(opts) {
    // set the shipping option
    this.order.get('items').at(0).get('shipping')
      .set(opts);
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

    // don't allow a zero price purchase
    const priceObj = this.prices[0];
    if (priceObj.price + priceObj.vPrice + priceObj.sPrice <= 0) {
      this.insertErrors(this.$errors, [app.polyglot.t('purchase.errors.zeroPrice')]);
      this.updatePageState('pay');
      this.actionBtn.render();
      return;
    }

    // set the shipping address if the listing is shippable
    if (this.shipping && this.shipping.selectedAddress) {
      this.order.addAddress(this.shipping.selectedAddress);
    }

    // set the moderator
    const moderator = this.order.moderated ? this.moderators.selectedIDs[0] : '';
    this.order.set({ moderator });
    this.order.set({}, { validate: true });


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
            this.payment = this.createChild(Payment, {
              balanceRemaining: this.purchase.get('amount'),
              paymentAddress: this.purchase.get('paymentAddress'),
              orderId: this.purchase.get('orderId'),
              isModerated: !!this.order.get('moderator'),
            });
            this.listenTo(this.payment, 'walletPaymentComplete',
              (pmtCompleteData => this.completePurchase(pmtCompleteData)));
            this.$('.js-pending').append(this.payment.render().el);
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

  get prices() {
    // create an array of price objects that matches the items in the order
    const prices = [];
    this.order.get('items').forEach(item => {
      const priceObj = {};
      const shipping = item.get('shipping');
      const sName = shipping.get('name');
      const sService = shipping.get('service');
      const sOpt = this.listing.get('shippingOptions').findWhere({ name: sName });
      const sOptService = sOpt ? sOpt.get('services').findWhere({ name: sService }) : '';
      // determine which skus match the chosen options
      const variantCombo = [];
      item.get('options').forEach((option, i) => {
        const variants = this.listing.get('item').get('options').at(i)
          .get('variants')
          .toJSON();
        const variantIndex = variants.findIndex(variant => variant.name === option.get('value'));
        variantCombo.push(variantIndex);
      });
      const sku = this.listing.get('item').get('skus').find(v =>
        _.isEqual(v.get('variantCombo'), variantCombo));

      priceObj.price = this.listing.get('item').get('price');
      priceObj.sPrice = sOptService ? sOptService.get('price') : 0;
      priceObj.aPrice = sOptService ? sOptService.get('additionalItemPrice') : 0;
      priceObj.vPrice = sku ? sku.get('surcharge') : 0;
      priceObj.quantity = item.get('quantity');
      prices.push(priceObj);
    });
    return prices;
  }

  get total() {
    const prices = this.prices;
    let priceTotal = 0;
    prices.forEach((priceObj) => {
      let itemPrice = priceObj.price + priceObj.vPrice;
      this.couponObj.forEach(coupon => {
        if (coupon.percentDiscount) {
          itemPrice -= itemPrice * 0.01 * coupon.percentDiscount;
        } else if (coupon.priceDiscount) {
          itemPrice -= coupon.priceDiscount;
        }
      });
      priceTotal = itemPrice * priceObj.quantity;
      priceTotal += priceObj.sPrice + priceObj.aPrice * (priceObj.quantity - 1);
    });

    return priceTotal;
  }

  isModAllowed() {
    const cur = this.listing.get('metadata').get('pricingCurrency');
    const total = convertCurrency(this.total, cur, getServerCurrency().code);
    const allowModeration = (total >= this.minModPrice) && !!this.moderatorIDs.length;
    this.moderationOn(allowModeration);
    this.getCachedEl('.js-modsNotAllowed').toggleClass('hide', allowModeration);
  }

  refreshPrices() {
    this.isModAllowed();
    this.receipt.updatePrices(this.prices);
  }

  get $popInMessages() {
    return this._$popInMessages ||
        (this._$popInMessages = this.$('.js-popInMessages'));
  }

  get $storeOwnerAvatar() {
    return this._$storeOwnerAvatar ||
        (this._$storeOwnerAvatar = this.$('.js-storeOwnerAvatar'));
  }

  get $closeBtn() {
    return this._$closeBtn ||
        (this._$closeBtn = this.$('.js-closeBtn'));
  }

  get $shippingErrors() {
    return this._$shippingErrors ||
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
    if (this.fetchFees) this.fetchFees.abort();
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();
    const state = this.getState();

    loadTemplate('modals/purchase/purchase.html', t => {
      this.$el.html(t({
        ...this.order.toJSON(),
        ...state,
        listing: this.listing.toJSON(),
        vendor: this.vendor,
        variants: this.variants,
        items: this.order.get('items').toJSON(),
        prices: this.prices,
        minModPrice: this.minModPrice,
        displayCurrency: app.settings.get('localCurrency'),
        hasModerators: !!this.moderatorIDs.length,
      }));

      super.render();

      this._$popInMessages = null;
      this._$storeOwnerAvatar = null;
      this._$closeBtn = null;
      this._$shippingErrors = null;
      this._$errors = null;
      this._$couponField = null;

      this.actionBtn.delegateEvents();
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      this.receipt.delegateEvents();
      this.$('.js-receipt').append(this.receipt.render().el);

      this.coupons.delegateEvents();
      this.$('.js-couponsWrapper').html(this.coupons.render().el);

      this.moderators.delegateEvents();
      this.$('.js-moderatorsWrapper').append(this.moderators.render().el);
      if (!state.isFetching) this.moderators.getModeratorsByID();

      if (this.shipping) {
        this.shipping.delegateEvents();
        this.$('.js-shippingWrapper').append(this.shipping.render().el);
      }

      // if this is a re-render, and the payment exists, render it
      if (this.payment) {
        this.payment.delegateEvents();
        this.$('.js-pending').append(this.payment.render().el);
      }

      this.complete.delegateEvents();
      this.$('.js-complete').append(this.complete.render().el);

      if (this.feeChange) this.feeChange.remove();
      this.feeChange = this.createChild(FeeChange);
      this.$('.js-feeChangeContainer').html(this.feeChange.render().el);

      this.isModAllowed();
    });

    return this;
  }
}
