import $ from 'jquery';
import app from '../../app';
import baseVw from '../baseVw';
import ConvoMessage from './ConvoMessage';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat messages collection.');
    }

    super(options);
    this.options = options;
    this.convoMessages = [];

    this.listenTo(this.collection, 'update', this.render);
  }

  className() {
    return 'chatConvoMessages';
  }

  events() {
    return {
      // 'click .js-closeConvo': 'onClickCloseConvo',
    };
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

    return convoMessage;
  }

  render() {
    const messagesContainer = document.createDocumentFragment();

    this.collection.forEach(message => {
      const convoMessage = this.createMessage(message);
      $(messagesContainer).append(convoMessage.render().el);
    });

    this.$el.empty()
      .append(messagesContainer);

    return this;
  }
}
