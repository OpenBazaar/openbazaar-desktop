import $ from 'jquery';
import app from '../../../app';
import { checkValidParticipantObject } from './OrderDetail.js';
import BaseVw from '../../baseVw';
import ConvoMessage from './ConvoMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat messages collection.');
    }

    if (!options.$scrollContainer) {
      throw new Error('Please provide the DOM element that handles scrolling for this view.');
    }

    checkValidParticipantObject(options.buyer, 'buyer');
    checkValidParticipantObject(options.vendor, 'vendor');

    if (options.moderator) {
      checkValidParticipantObject(options.moderator, 'moderator');
    }

    super(options);
    this.options = options;
    this.buyer = options.buyer;
    this.vendor = options.vendor;
    this.moderator = options.moderator;

    this.$scrollContainer = options.$scrollContainer;
    this.convoMessages = [];

    this.listenTo(app.profile.get('avatarHashes'), 'change', this.render);
  }

  className() {
    return 'chatConvoMessages';
  }

  markMessageAsRead(id) {
    if (!id) {
      throw new Error('Please provide an id.');
    }

    const message = this.collection.get(id);

    if (message) {
      const messageIndex = this.collection.indexOf(message);

      this.convoMessages[messageIndex]
        .setState({ showAsRead: true });

      // Only one message should be marked as read, so if there already was one,
      // we'll unmark it.
      if (this.messageMarkedAsRead) {
        const index = this.collection.indexOf(this.messageMarkedAsRead);

        if (index !== -1) {
          this.convoMessages[index].setState({ showAsRead: false });
        }
      }
    }
  }

  createMessage(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const initialState = {};

    let participant = this.buyer;
    initialState.role = 'buyer';
    let peerId = model.get('peerId');

    if (model.get('outgoing')) {
      initialState.avatarHashes = app.profile.get('avatarHashes').toJSON();
      peerId = app.profile.id;
    }

    if (peerId === this.vendor.id) {
      participant = this.vendor;
      initialState.role = 'vendor';
    } else if (this.moderator && peerId === this.moderator.id) {
      participant = this.moderator;
      initialState.role = 'moderator';
    }


    const convoMessage = this.createChild(ConvoMessage, {
      ...options,
      model,
      initialState: {
        ...options.initialState,
        ...initialState,
      },
    });

    if (!model.get('outgoing')) {
      participant.getProfile().done(profileMd => {
        if (!convoMessage.isRemoved()) {
          convoMessage.setState({
            avatarHashes: profileMd.get('avatarHashes').toJSON(),
          });
        }
      });
    }

    this.convoMessages.push(convoMessage);

    return convoMessage;
  }

  render() {
    const messagesContainer = document.createDocumentFragment();

    this.convoMessages.forEach(convoMessage => (convoMessage.remove()));
    this.convoMessages = [];

    this.collection.forEach(message => {
      const convoMessage = this.createMessage(message);
      $(messagesContainer).append(convoMessage.render().el);
    });

    // We only want to mark the last 'read' message as read.
    this.messageMarkedAsRead = this.collection.slice()
      .reverse()
      .find(message => (message.get('read') && message.get('outgoing')));

    const lastReadIndex = this.collection.indexOf(this.messageMarkedAsRead);

    if (lastReadIndex !== -1) {
      this.convoMessages[lastReadIndex].setState({ showAsRead: true });
    }

    this.$el.empty()
      .append(messagesContainer);

    return this;
  }
}
