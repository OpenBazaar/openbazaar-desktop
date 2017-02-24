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

    this.listenTo(app.profile.get('avatarHashes'), 'change', this.render);
  }

  className() {
    return 'chatConvoMessages';
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
