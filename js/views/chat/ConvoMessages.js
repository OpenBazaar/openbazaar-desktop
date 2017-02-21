import $ from 'jquery';
// import _ from 'underscore';
// import loadTemplate from '../../utils/loadTemplate';
// import ChatMessages from '../../collections/ChatMessages';
// import Profile from '../../models/profile/Profile';
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

  render() {
    const messagesContainer = document.createDocumentFragment();

    this.collection.forEach(message => {
      const convoMessage = new ConvoMessage({
        model: message,
      });

      $(messagesContainer).append(convoMessage.render().el);
    });

    this.$el.empty()
      .append(messagesContainer);

    return this;
  }
}
