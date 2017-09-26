import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import ChatMessage from '../../../models/chat/ChatMessage';
import Listing from '../../../models/listing/Listing';


export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }
    super(options);
    this.options = options;

    this.processingTime = this.options.listing.get('item').processingTime ||
      app.polyglot.t('purchase.completeSection.noData');
    this.vendorPeerID = this.options.listing.get('vendorID').peerID;
    this._orderID = '';
  }

  className() {
    return 'complete';
  }

  events() {
    return {
      'click .js-goToListing': 'close',
      'keydown #messageInput': 'keyDownMessageInput',
      'click .js-send': 'sendMessageInput',
    };
  }

  sendMessage(msg) {
    if (!msg) {
      throw new Error('Please provide a message to send.');
    }

    const chatMessage = new ChatMessage({
      peerId: this.vendorPeerID,
      subject: this.orderID,
      message: msg,
    });

    const save = chatMessage.save();
    let messageSent = true;

    if (save) {
      this.$send.addClass('disabled');
      this.$messageSent.removeClass('hide');
    } else {
      // Developer error - this shouldn't happen.
      console.error('There was an error saving the chat message.');
      console.dir(chatMessage.validationError);
      messageSent = false;
    }

    return messageSent;
  }

  sendMessageInput() {
    const message = this.$messageInput.val().trim();
    if (message) this.sendMessage(message);
    this.$messageInput.val('');
  }

  keyDownMessageInput(e) {
    this.$send.toggleClass('disabled', !e.target.value);
    this.$messageSent.addClass('hide');

    // if the key pressed is not enter, do nothing
    if (e.shiftKey || e.which !== 13) return;
    e.preventDefault();
    this.sendMessageInput();
    e.preventDefault();
  }

  get orderID() {
    return this._orderID;
  }

  set orderID(orderID) {
    if (orderID !== this._orderID) this._orderID = orderID;
  }

  get $messageInput() {
    return this._$messageInput ||
      (this._$messageInput = this.$('#messageInput'));
  }

  get $send() {
    return this._$send ||
      (this._$send = this.$('.js-send'));
  }

  get $messageSent() {
    return this._$messageSent ||
      (this._$messageSent = this.$('.js-messageSent'));
  }

  render() {
    loadTemplate('modals/purchase/complete.html', t => {
      this.$el.html(t({
        displayCurrency: app.settings.get('localCurrency'),
        processingTime: this.processingTime,
        maxMessageLength: ChatMessage.max.messageLength,
        ownProfile: app.profile.toJSON(),
        orderID: this.orderID,
        vendorName: this.options.vendor.name,
      }));

      this._$messageInput = null;
      this._$send = null;
      this._$messageSent = null;
    });

    return this;
  }
}
