import $ from 'jquery';
import app from '../../app';
import baseVw from '../baseVw';
import ConvoMessage from './ConvoMessage';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat messages collection.');
    }

    if (!options.$scrollContainer) {
      // The scroll container should ideally be an ancestor of this view's element.
      throw new Error('Please provide the DOM element that handles scrolling for this view.');
    }

    super(options);
    this.options = options;
    this.$scrollContainer = options.$scrollContainer;
    this.convoMessages = [];

    // this.listenTo(this.collection, 'update', this.render);
    // this.listenTo(this.collection, 'update', this.onUpdate);
    this.listenTo(app.profile.get('avatarHashes'), 'change', this.render);
  }

  className() {
    return 'chatConvoMessages';
  }

  onUpdate(cl, opts) {
    const prevScroll = {};
    const $scroll = this.$scrollContainer;

    prevScroll.height = $scroll[0].scrollHeight;
    prevScroll.top = $scroll[0].scrollTop;

    this.render();

    // Expecting either a new page of messages at the beginning of the collection or
    // a new single message at the end of the collection. In either of those scenarios
    // we'll adjust the scroll position as appopriate.

    if (opts.changes.added.length === 1 &&
      cl.indexOf(opts.changes.added[0]) === cl.length - 1) {
      // New message at bottom.
      if (prevScroll.top >= prevScroll.height - $scroll[0].clientHeight - 10) {
        // If at the the time of creating the new message, we were scrolled within 10 pixels
        // of the bottom of the container, then upon adding the new message, we'll scroll to
        // the bottom
      }
    }

    if (opts.changes.added.length === 1) {
      // Single new message added.

      const newMessage = opts.changes.added[0];

      if (cl.indexOf(newMessage) === cl.length - 1) {
        // It's the last message.

        if (newMessage.get('outgoing')) {
          // It's our own message, so we'll auto scroll to the bottom.
          $scroll[0].scrollTop = $scroll[0].scrollHeight;
        } else if (prevScroll.top >= prevScroll.height - $scroll[0].clientHeight - 10) {
          // For an incoming message, if we were scrolled within 10px of the bottom at the
          // time the message came, we'll auto-scroll. Otherwise, we'll leave you where you were.
          $scroll[0].scrollTop = $scroll[0].scrollHeight;
        }
      }
    } else if (opts.changes.added.length &&
      cl.indexOf(opts.changes.added[opts.changes.added.length - 1]) !==
      this.convoMessages[0].model) {
      // New page of messages added up top. We'll scroll 
    }
  }

  createMessage(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const initialState = {};

    if (model.get('outgoing')) {
      initialState.avatarHashes = app.profile.get('avatarHashes').toJSON();
    }

    const convoMessage = this.createChild(ConvoMessage, {
      ...options,
      model,
      initialState: {
        ...options.initialState,
        ...initialState,
      },
    });

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

    this.$el.empty()
      .append(messagesContainer);

    return this;
  }
}
