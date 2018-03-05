import $ from 'jquery';
import _ from 'underscore';
import '../../../lib/select2';
import '../../../utils/lib/velocity';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchSettingsModal } from '../../../utils/modalManager';
import { openSimpleMessage } from '../SimpleMessage';
import BaseModal from '../BaseModal';
import Order from '../../../models/purchase/Order';
import Item from '../../../models/purchase/Item';
import Listing from '../../../models/listing/Listing';
import Purchase from '../../../models/purchase/Purchase';
import PopInMessage, { buildRefreshAlertMessage } from '../../components/PopInMessage';
import Moderators from '../../components/Moderators';
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
    const shippable = !!(shippingOptions && shippingOptions.length);

    const moderatorIDs = this.listing.get('moderators') || [];
    const disallowedIDs = [app.profile.id, this.listing.get('vendorID').peerID];
    this.moderatorIDs = _.without(moderatorIDs, ...disallowedIDs);
    this.setState({
      showModerators: this.moderatorIDs.length,
      showOnlyVerified: true,
    }, { renderOnChange: false });

    this.couponObj = [];

    this.order = new Order(
      {},
      {
        shippable,
        moderated: this.moderatorIDs.length && app.verifiedMods.matched(this.moderatorIDs).length,
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
      useCache: false,
      showVerifiedOnly: true,
      fetchErrorTitle: app.polyglot.t('purchase.errors.moderatorsTitle'),
      fetchErrorMsg: app.polyglot.t('purchase.errors.moderatorsMsg'),
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      selectFirst: true,
      radioStyle: true,
    });
    // render the moderators so it can start fetching and adding moderator cards
    this.moderators.render();
    this.moderators.getModeratorsByID();
    this.listenTo(this.moderators, 'noValidModerators', () => this.onNoValidModerators());
    this.listenTo(this.moderators, 'clickShowUnverified', () => this.togVerifiedModerators(false));
    this.listenTo(this.moderators, 'cardSelect', () => this.onCardSelect());

    if (this.listing.get('shippingOptions').length) {
      this.shipping = this.createChild(Shipping, {
        model: this.listing,
      });
      this.listenTo(this.shipping, 'shippingOptionSelected', ((sOpts) => {
        this.updateShippingOption(sOpts);
      }));
    }

    this.complete = this.createChild(Complete, {
      listing: this.listing,
      vendor: this.vendor,
    });

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
    this.listenTo(this.order.get('items').at(0), 'someChange ', () => this.refreshPrices());
    this.listenTo(this.order.get('items').at(0).get('shipping'), 'change', () =>
      this.refreshPrices());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {
      'click .js-goToListing': 'clickGoToListing',
      'click .js-close': 'clickClose',
      'click .js-retryFee': 'clickRetryFee',
      'click .js-directPayment': 'clickDirectPurchase',
      'change #purchaseQuantity': 'changeQuantityInput',
      'click .js-newAddress': 'clickNewAddress',
      'click .js-applyCoupon': 'applyCoupon',
      'keyup #couponCode': 'onKeyUpCouponCode',
      'blur #emailAddress': 'blurEmailAddress',
      'blur #memo': 'blurMemo',
      'click #verifiedOnly': 'onClickVerifiedOnly',
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

  clickDirectPurchase() {
    if (!this.order.moderated) return;

    this.order.moderated = false;
    this.moderators.deselectOthers();
    this.render();
  }

  onNoValidModerators() {
    this.order.moderated = false;
    this.render();
  }

  togVerifiedModerators(bool) {
    this.moderators.togVerifiedShown(bool);
    this.setState({ showOnlyVerified: bool });
  }

  onClickVerifiedOnly(e) {
    this.togVerifiedModerators($(e.target).prop('checked'));
  }

  onCardSelect() {
    this.order.moderated = true;
    const selected = this.moderators.selectedIDs;
    const unverifedSelected = selected.length && !app.verifiedMods.matched(selected).length;
    this.setState({ unverifedSelected }, { renderOnChange: false });
    this.render(); // always render even if the state didn't change
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
  }

  purchaseListing() {
    // clear any old errors
    const allErrContainers = this.$('div[class $="-errors"]');
    allErrContainers.each((i, container) => $(container).html(''));

    // don't allow a zero or negative price purchase
    const priceObj = this.prices[0];
    if (priceObj.price + priceObj.vPrice + priceObj.sPrice <= 0) {
      this.insertErrors(this.getCachedEl('.js-errors'),
        [app.polyglot.t('purchase.errors.zeroPrice')]);
      this.setState({ phase: 'pay' });
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

    this.setState({ phase: 'processing' });

    if (!this.order.validationError) {
      if (this.listing.isOwnListing) {
        this.setState({ phase: 'pay' });
        // don't allow a seller to buy their own items
        const errTitle = app.polyglot.t('purchase.errors.ownIDTitle');
        const errMsg = app.polyglot.t('purchase.errors.ownIDMsg');
        openSimpleMessage(errTitle, errMsg);
      } else {
        $.post({
          url: app.getServerUrl('ob/purchase'),
          data: JSON.stringify(this.order.toJSON()),
          dataType: 'json',
          contentType: 'application/json',
        })
          .done((data) => {
            this.setState({ phase: 'pending' });
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
            this.setState({ phase: 'pay' });
            if (jqXHR.statusText === 'abort') return;
            const errMsg = jqXHR.responseJSON && jqXHR.responseJSON.reason || '';
            const errTitle = app.polyglot.t('purchase.errors.orderError');
            openSimpleMessage(errTitle, errMsg);
          });
      }
    } else {
      this.setState({ phase: 'pay' });
      Object.keys(this.order.validationError).forEach(errKey => {
        const domKey = errKey.replace(/\[[^\[\]]*\]/g, '').replace('.', '-');
        let container = this.$(`.js-${domKey}-errors`);
        // if no container exists, use the generic container
        container = container.length ? container : this.getCachedEl('.js-errors');
        this.insertErrors(container, this.order.validationError[errKey]);
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

  refreshPrices() {
    this.receipt.updatePrices(this.prices);
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
        displayCurrency: app.settings.get('localCurrency'),
        moderated: this.order.moderated,
      }));

      super.render();

      this._$couponField = null;

      this.actionBtn.delegateEvents();
      this.actionBtn.setState({ phase: state.phase });
      this.$('.js-actionBtn').append(this.actionBtn.render().el);

      this.receipt.delegateEvents();
      this.$('.js-receipt').append(this.receipt.render().el);

      this.coupons.delegateEvents();
      this.$('.js-couponsWrapper').html(this.coupons.render().el);

      this.moderators.delegateEvents();
      this.$('.js-moderatorsWrapper').append(this.moderators.el);

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
    });

    return this;
  }
}
