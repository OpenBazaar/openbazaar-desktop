import $ from 'jquery';
import baseVw from '../baseVw';
import ChatHead from './ChatHead';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat conversations collection.');
    }

    if (!options.$scrollContainer) {
      throw new Error('Please provide a jQuery object containing the scrollable element ' +
        'this view is in.');
    }

    super(options);
    this._chatHeadViews = [];
    this.$scrollContainer = options.$scrollContainer;
    this.listenTo(this.collection, 'update', this.onCollectionUpdate);
    // this.listenTo(this.collection, 'sort', this.render);
  }

  className() {
    return 'chatHeads flexColRows gutterVSm';
  }

  onCollectionUpdate(cl, options) {
    // If a single model is added to the top of the list, we'll add it to the
    // UI and adjust the scroll position for the list doesn't jump.
    if (options.changes.added.length === 1 &&
      this.collection.indexOf(options.changes.added[0]) === 0) {
      const prevScroll = {};

      prevScroll.height = this.$scrollContainer[0].scrollHeight;
      prevScroll.top = this.$scrollContainer[0].scrollTop;

      // const view = this.createChatHead(options.changes.added[0]);
      // this.$el.prepend(view.render().el);
      this.render();

      this.$scrollContainer[0].scrollTop = prevScroll.top +
        (this.$scrollContainer[0].scrollHeight - prevScroll.height);
    } else {
      this.render();
    }
  }

  get views() {
    return this._chatHeadViews;
  }

  createChatHead(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const chatHead = this.createChild(ChatHead, {
      ...options,
      model,
    });

    this._chatHeadViews.push(chatHead);
    this.listenTo(chatHead, 'click', (...args) => this.trigger('chatHeadClick', ...args));

    return chatHead;
  }

  clearChatHeadViews() {
    this._chatHeadViews.forEach(vw => vw.remove());
    this._chatHeadViews = [];
  }

  render() {
    this.clearChatHeadViews();

    const headsContainer = document.createDocumentFragment();

    this.collection.forEach(chatHead => {
      const view = this.createChatHead(chatHead);
      $(headsContainer).append(view.render().el);
    });

    this.$el.empty()
      .append(headsContainer);

    this.trigger('rendered');

    return this;
  }
}
