import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import '../../../lib/select2';
import '../../../utils/lib/velocity';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchSettingsModal } from '../../../utils/modalManager';
import {
  getInventory,
  events as inventoryEvents,
} from '../../../utils/inventory';
import { startAjaxEvent, endAjaxEvent } from '../../../utils/metrics';
import { toStandardNotation } from '../../../utils/number';
import { getExchangeRate, integerToDecimal } from '../../../utils/currency';
import { capitalize } from '../../../utils/string';
import { events as outdatedListingHashesEvents } from '../../../utils/outdatedListingHashes';
import { isSupportedWalletCur } from '../../../data/walletCurrencies';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import BaseModal from '../BaseModal';
import { openSimpleMessage } from '../SimpleMessage';
import PopInMessage, { buildRefreshAlertMessage } from '../../components/PopInMessage';
import Moderators from '../../components/moderators/Moderators';
import FeeChange from '../../components/FeeChange';
import CryptoTradingPair from '../../components/CryptoTradingPair';
import CryptoCurSelector from '../../components/CryptoCurSelector';
import Shipping from './Shipping';
import Receipt from './Receipt';
import Coupons from './Coupons';
import ActionBtn from './ActionBtn';
import Payment from './Payment';
import Complete from './Complete';
import DirectPayment from './DirectPayment';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }

    const opts = {
      ...options,
      initialState: {
        phase: 'pay',
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;
    this.listing = opts.listing;
    this.variants = opts.variants;
    this.vendor = opts.vendor;
    const shippingOptions = this.listing.get('shippingOptions');
    const moderatorIDs = this.listing.get('moderators') || [];
    const disallowedIDs = [app.profile.id, this.listing.get('vendorID').peerID];
    this.moderatorIDs = _.without(moderatorIDs, ...disallowedIDs);

    this.setState({
      showModerators: this.moderatorIDs.length,
      showVerifiedOnly: true,
    }, { renderOnChange: false });

    this.couponObj = [];

    this.order = new Order(
      {},
      {
        shippable: !!(shippingOptions && shippingOptions.length),
        moderated: this.moderatorIDs.length && app.verifiedMods.matched(this.moderatorIDs).length,
      });

    /*
       to support multiple items in a purchase in the future, pass in listings in the options,
       and add them to the order as items here.
    */
    const item = new Item(
      {
        listingHash: this.listing.get('hash'),
        quantity: !this.listing.isCrypto ? 1 : undefined,
        options: opts.variants || [],
      },
      {
        isCrypto: this.listing.isCrypto,
        inventory: () =>
          (typeof this.inventory === 'number' ?
            this.inventory : 99999999999999999),
      }
    );
    // add the item to the order.
    this.order.get('items').add(item);

    this.actionBtn = this.createChild(ActionBtn, {
      listing: this.listing,
    });
    this.listenTo(this.actionBtn, 'purchase', () => this.purchaseListing());
    this.listenTo(this.actionBtn, 'close', () => this.close());
    this.listenTo(this.actionBtn, 'reloadOutdated', () => {
      let defaultPrevented = false;

      this.trigger('clickReloadOutdated', {
        preventDefault: () => (defaultPrevented = true),
      });

      setTimeout(() => {
        if (!defaultPrevented) {
          Backbone.history.loadUrl();
        }
      });
    });

    this.receipt = this.createChild(Receipt, {
      model: this.order,
      listing: this.listing,
      prices: this.prices,
      couponObj: this.couponObj,
    });

    this.coupons = this.createChild(Coupons, {
      coupons: this.listing.get('coupons'),
      listingPrice: this.listing.price.amount,
    });
    this.listenTo(this.coupons, 'changeCoupons',
      (hashes, codes) => this.changeCoupons(hashes, codes));

    const currencies = this.listing.get('metadata').get('acceptedCurrencies') || [];
    const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
    currencies.sort((a, b) => {
      const aName = app.polyglot.t(`cryptoCurrencies.${a}`, { _: a });
      const bName = app.polyglot.t(`cryptoCurrencies.${b}`, { _: b });
      return aName.localeCompare(bName, locale, { sensitivity: 'base' });
    });

    const disabledCurs = currencies.filter(c => !isSupportedWalletCur(c));
    this.cryptoCurSelector = this.createChild(CryptoCurSelector, {
      disabledMsg: app.polyglot.t('purchase.cryptoCurrencyInvalid'),
      initialState: {
        controlType: 'radio',
        currencies,
        disabledCurs,
        sort: false,
      },
    });
    this.listenTo(this.cryptoCurSelector, 'currencyClicked', (cOpts) => {
      if (cOpts.active) this.moderators.setState({ showOnlyCur: cOpts.currency });
    });

    this.moderators = this.createChild(Moderators, {
      moderatorIDs: this.moderatorIDs,
      useCache: false,
      fetchErrorTitle: app.polyglot.t('purchase.errors.moderatorsTitle'),
      fetchErrorMsg: app.polyglot.t('purchase.errors.moderatorsMsg'),
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      radioStyle: true,
      initialState: {
        showOnlyCur: currencies[0],
        showVerifiedOnly: true,
      },
    });
    // render the moderators so it can start fetching and adding moderator cards
    this.moderators.render();
    this.moderators.getModeratorsByID();
    this.listenTo(this.moderators, 'noModsShown', () => this.render());
    this.listenTo(this.moderators, 'clickShowUnverified', () => {
      this.setState({ showVerifiedOnly: false });
    });
    this.listenTo(this.moderators, 'cardSelect', () => this.onCardSelect());

    if (this.listing.get('shippingOptions').length) {
      this.shipping = this.createChild(Shipping, {
        model: this.listing,
      });
      this.listenTo(this.shipping, 'shippingOptionSelected', () => this.updateShippingOption());
      // set the initial shipping option
      this.updateShippingOption();
      this.refreshPrices();
    }

    this.complete = this.createChild(Complete, {
      listing: this.listing,
      vendor: this.vendor,
    });

    // If the parent has the inventory, pass it in, otherwise we'll fetch it.
    this.inventory = this.options.inventory;
    if (this.listing.isCrypto &&
      typeof this.inventory !== 'number') {
      this.inventoryFetch = getInventory(
        this.listing.get('vendorID').peerID,
        {
          slug: this.listing.get('slug'),
          coinDivisibility:
            this.listing.get('metadata')
              .get('coinDivisibility'),
        }
      ).done(e => (this.inventory = e.inventory));
      this.listenTo(inventoryEvents, 'inventory-change',
        e => (this.inventory = e.inventory));
    }

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
    this.listenTo(this.order.get('items').at(0), 'someChange ', () => this.refreshPrices());
    this.listenTo(this.order.get('items').at(0).get('shipping'), 'change', () =>
      this.refreshPrices());

    this.hasVerifiedMods = app.verifiedMods.matched(this.moderatorIDs).length > 0;

    this.listenTo(app.verifiedMods, 'update', () => {
      const newHasVerifiedMods = app.verifiedMods.matched(moderatorIDs).length > 0;
      if (newHasVerifiedMods !== this.hasVerifiedMods) {
        this.hasVerifiedMods = newHasVerifiedMods;
        this.showDataChangedMessage();
      }
    });

    this._latestHash = this.listing.get('hash');
    this._renderedHash = null;

    this.listenTo(outdatedListingHashesEvents, 'newHash', e => {
      this._latestHash = e.oldHash;
      if (e.oldHash === this._renderedHash) this.outdateHash();
    });
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {
      'click .js-goToListing': 'clickGoToListing',
      'click .js-close': 'clickClose',
      'click .js-retryFee': 'clickRetryFee',
      'change #purchaseQuantity': 'changeQuantityInput',
      'change #purchaseCryptoAddress': 'changeCryptoAddress',
      'click .js-newAddress': 'clickNewAddress',
      'click .js-applyCoupon': 'applyCoupon',
      'keyup #couponCode': 'onKeyUpCouponCode',
      'blur #emailAddress': 'blurEmailAddress',
      'blur #memo': 'blurMemo',
      'click .js-purchaseVerifiedOnly': 'onClickVerifiedOnly',
      'change #cryptoAmountCurrency': 'changeCryptoAmountCurrency',
      'keyup [name="quantity"]': 'keyupQuantity',
      ...super.events(),
    };
  }

  get inventory() {
    return this._inventory;
  }

  set inventory(inventory) {
    this._inventory = inventory;
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('purchase.purchaseDataChangedPopin')),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => {
        this.render();
        this.moderators.render();
      });

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.getCachedEl('.js-popInMessages').append(this.dataChangePopIn.render().el);
    }
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

  handleDirectPurchaseClick() {
    if (!this.isModerated) return;

    this.moderators.deselectOthers();
    this.setState({ unverifedSelected: false }, { renderOnChange: false });
    this.render(); // always render even if the state didn't change
  }

  togVerifiedModerators(bool) {
    this.moderators.togVerifiedShown(bool);
    this.setState({ showVerifiedOnly: bool });
  }

  onClickVerifiedOnly(e) {
    this.togVerifiedModerators($(e.target).prop('checked'));
  }

  onCardSelect() {
    const selected = this.moderators.selectedIDs;
    const unverifedSelected = selected.length && !app.verifiedMods.matched(selected).length;
    this.setState({ unverifedSelected }, { renderOnChange: false });
    this.render(); // always render even if the state didn't change
  }

  changeCryptoAddress(e) {
    this.order.get('items')
      .at(0)
      .set('paymentAddress', e.target.value);
  }

  setModelQuantity(quantity, cur = this.cryptoAmountCurrency) {
    if (this.listing.isCrypto && (typeof cur !== 'string' || !cur)) {
      throw new Error('Please provide the currency code as a valid, non-empty string.');
    }

    let mdQuantity = quantity;
    const numericQuantity = parseFloat(quantity);

    if (this.listing.isCrypto &&
      cur !== this.listing.get('metadata')
        .get('coinType') &&
      !isNaN(numericQuantity)) {
      mdQuantity = (numericQuantity / getExchangeRate(cur)) *
        getExchangeRate(this.listing.get('metadata').get('coinType'));
      // round to 4 decimal place
      mdQuantity = Math.round(mdQuantity * 10000) / 10000;
    }

    this.order.get('items')
      .at(0)
      .set({ quantity: mdQuantity });
  }

  changeCryptoAmountCurrency(e) {
    this._cryptoAmountCurrency = e.target.value;
    const quantity = this.getFormData(
      this.getCachedEl('#cryptoAmount')
    ).quantity;
    this.setModelQuantity(quantity);
  }

  keyupQuantity(e) {
    // wait until they stop typing
    if (this.searchKeyUpTimer) {
      clearTimeout(this.searchKeyUpTimer);
    }

    this.searchKeyUpTimer = setTimeout(() => {
      const quantity = this.getFormData($(e.target)).quantity;
      if (this.listing.isCrypto) this._cryptoQuantity = quantity;
      this.setModelQuantity(quantity);
    }, 150);
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

  updateShippingOption() {
    // Set the shipping option.
    this.order.get('items').at(0).get('shipping')
      .set(this.shipping.selectedOption);
  }

  outdateHash() {
    this.actionBtn.setState({ outdatedHash: true });
  }

  purchaseListing() {
    // Clear any old errors.
    const allErrContainers = this.$('div[class $="-errors"]');
    allErrContainers.each((i, container) => $(container).html(''));

    // Don't allow a zero or negative price purchase.
    const priceObj = this.prices[0];
    if (priceObj.price + priceObj.vPrice + priceObj.sPrice <= 0) {
      this.insertErrors(this.getCachedEl('.js-errors'),
        [app.polyglot.t('purchase.errors.zeroPrice')]);
      this.setState({ phase: 'pay' });
      return;
    }

    // Set the payment coin.
    const paymentCoin = this.cryptoCurSelector.getState().activeCurs[0];
    this.order.set({ paymentCoin });

    // Set the shipping address if the listing is shippable.
    if (this.shipping && this.shipping.selectedAddress) {
      this.order.addAddress(this.shipping.selectedAddress);
    }

    // Set the moderator.
    const moderator = this.moderators.selectedIDs[0] || '';
    this.order.set({ moderator });
    this.order.set({}, { validate: true });

    // Cancel any existing order.
    if (this.orderSubmit) this.orderSubmit.abort();

    this.setState({ phase: 'processing' });

    startAjaxEvent('Purchase');
    const segmentation = {
      paymentCoin,
      moderated: !!moderator,
    };

    if (!this.order.validationError) {
      if (this.listing.isOwnListing) {
        this.setState({ phase: 'pay' });
        // don't allow a seller to buy their own items
        const errTitle = app.polyglot.t('purchase.errors.ownIDTitle');
        const errMsg = app.polyglot.t('purchase.errors.ownIDMsg');
        openSimpleMessage(errTitle, errMsg);
        endAjaxEvent('Purchase', {
          ...segmentation,
          errors: 'own listing',
        });
      } else {
        const coinDivisibility = this.listing.get('metadata')
          .get('coinDivisibility');

        $.post({
          url: app.getServerUrl('ob/purchase'),
          data: JSON.stringify({
            ...this.order.toJSON(),
            items: this.order.get('items')
              .map(item => ({
                ...item.toJSON(),
                quantity: this.listing.isCrypto ?
                  // round to ensure integer
                  Math.round(item.get('quantity') * coinDivisibility) :
                  item.get('quantity'),
              })),
          }),
          dataType: 'json',
          contentType: 'application/json',
        })
          .done((data) => {
            this.setState({ phase: 'pending' });
            this.payment = this.createChild(Payment, {
              balanceRemaining: integerToDecimal(data.amount, paymentCoin),
              paymentAddress: data.paymentAddress,
              orderId: data.orderId,
              isModerated: !!this.order.get('moderator'),
              metricsOrigin: 'Purchase',
              paymentCoin,
            });
            this.listenTo(this.payment, 'walletPaymentComplete',
              (pmtCompleteData => this.completePurchase(pmtCompleteData)));
            this.$('.js-pending').append(this.payment.render().el);
            endAjaxEvent('Purchase');
          })
          .fail(jqXHR => {
            this.setState({ phase: 'pay' });
            if (jqXHR.statusText === 'abort') return;
            let errTitle = app.polyglot.t('purchase.errors.orderError');
            let errMsg = jqXHR.responseJSON && jqXHR.responseJSON.reason || '';

            if (jqXHR.responseJSON &&
              jqXHR.responseJSON.code === 'ERR_INSUFFICIENT_INVENTORY' &&
              typeof jqXHR.responseJSON.remainingInventory === 'number') {
              this.inventory = jqXHR.responseJSON.remainingInventory /
                this.listing.get('metadata')
                  .get('coinDivisibility');
              errTitle = app.polyglot.t('purchase.errors.insufficientInventoryTitle');
              errMsg = app.polyglot.t('purchase.errors.insufficientInventoryBody', {
                smart_count: this.inventory,
                remainingInventory: new Intl.NumberFormat(app.settings.get('localCurrency'), {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 8,
                }).format(this.inventory),
              });
              if (this.inventoryFetch) this.inventoryFetch.abort();
            }

            openSimpleMessage(errTitle, errMsg);
            endAjaxEvent('Purchase', {
              ...segmentation,
              errors: errMsg || 'unknown error',
            });
          });
      }
    } else {
      this.setState({ phase: 'pay' });
      const purchaseErrs = {};
      Object.keys(this.order.validationError).forEach(errKey => {
        const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
        let container = this.$(`.js-${domKey}-errors`);
        // if no container exists, use the generic container
        container = container.length ? container : this.getCachedEl('.js-errors');
        const err = this.order.validationError[errKey];
        this.insertErrors(container, err);
        purchaseErrs[`UserError-${domKey}`] = err.join(', ');
      });
      endAjaxEvent('Purchase', {
        ...segmentation,
        errors: 'User Error',
        ...purchaseErrs,
      });
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
    this.setState({ phase: 'complete' });
  }

  get prices() {
    // return an array of price objects that matches the items in the order
    return this.order.get('items').map(item => {
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

      return {
        price: this.listing.price.amount,
        sPrice: sOptService ? sOptService.get('price') : 0,
        aPrice: sOptService ? sOptService.get('additionalItemPrice') : 0,
        vPrice: sku ? sku.get('surcharge') : 0,
        quantity: item.get('quantity'),
      };
    });
  }

  refreshPrices() {
    this.receipt.updatePrices(this.prices);
  }

  get $couponField() {
    return this._$couponField ||
      (this._$couponField = this.$('#couponCode'));
  }

  get cryptoAmountCurrency() {
    return this._cryptoAmountCurrency ||
      this.listing.get('metadata')
        .get('coinType');
  }

  get isModerated() {
    return this.moderators.selectedIDs.length > 0;
  }

  remove() {
    if (this.orderSubmit) this.orderSubmit.abort();
    if (this.inventoryFetch) this.inventoryFetch.abort();
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();
    const state = this.getState();
    const item = this.order.get('items')
      .at(0);
    const quantity = item.get('quantity');
    const metadata = this.listing.get('metadata');

    let uiQuantity = quantity;

    if (this.listing.isCrypto && this._cryptoQuantity !== undefined) {
      uiQuantity = typeof quantity === 'number' ?
        toStandardNotation(this._cryptoQuantity) : this._cryptoQuantity;
    }

    loadTemplate('modals/purchase/purchase.html', t => {
      this.$el.html(t({
        ...this.order.toJSON(),
        ...state,
        listing: this.listing.toJSON(),
        listingPrice: this.listing.price,
        itemConstraints: this.order.get('items')
          .at(0)
          .constraints,
        vendor: this.vendor,
        variants: this.variants,
        prices: this.prices,
        displayCurrency: app.settings.get('localCurrency'),
        quantity: uiQuantity,
        cryptoAmountCurrency: this.cryptoAmountCurrency,
        isCrypto: this.listing.isCrypto,
        phaseClass: `phase${capitalize(state.phase)}`,
        hasCoupons: this.listing.get('coupons').length,
      }));

      super.render();

      this._$couponField = null;

      this.actionBtn.delegateEvents();
      this.actionBtn.setState({ phase: state.phase }, { renderOnChange: false });
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      this.receipt.delegateEvents();
      this.$('.js-receipt').append(this.receipt.render().el);

      this.coupons.delegateEvents();
      this.$('.js-couponsWrapper').html(this.coupons.render().el);

      this.moderators.delegateEvents();
      this.$('.js-moderatorsWrapper').append(this.moderators.el);

      if (this.directPayment) this.directPayment.remove();
      this.directPayment = this.createChild(DirectPayment, {
        initialState: {
          active: !this.isModerated,
        },
      });
      this.listenTo(this.directPayment, 'click', () => this.handleDirectPurchaseClick());
      this.$('.js-directPaymentWrapper').append(this.directPayment.render().el);

      this.cryptoCurSelector.delegateEvents();
      this.$('.js-cryptoCurSelectorWrapper').append(this.cryptoCurSelector.render().el);

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

      if (this.listing.isCrypto) {
        if (this.cryptoTitle) this.cryptoTitle.remove();
        this.cryptoTitle = this.createChild(CryptoTradingPair, {
          initialState: {
            tradingPairClass: 'cryptoTradingPairXL',
            exchangeRateClass: 'clrT2 tx6',
            fromCur: metadata.get('acceptedCurrencies')[0],
            toCur: metadata.get('coinType'),
          },
        });
        this.getCachedEl('.js-cryptoTitle')
          .html(this.cryptoTitle.render().el);

        this.$('#cryptoAmountCurrency').select2({ minimumResultsForSearch: Infinity });
      }
    });

    this._renderedHash = this.listing.get('hash');

    return this;
  }
}
