import BaseVw from './baseVw';
import StatusMessageMd from '../models/StatusMessage';
import StatusMessages from '../collections/StatusMessages';
import StatusMessageVw from './StatusMessage';

export default class extends BaseVw {
  constructor() {
    this.collection = new StatusMessages();
    this.vwRemoveTimeouts = [];
    this.mdRemoveTimeouts = [];

    this.listenTo(this.collection, 'add', this.onAddMessage);
    this.listenTo(this.collection, 'remove', this.onRemoveMessage);
  }

  onRemoveMessage(md, cl, opts) {
    const vw = this.msgViews.splice(opts.index, 1)[0];

    vw.$el.removeClass('slideUp');

    // give any animations some time to complete and then remove the view
    const timeout = setTimeout(() => {
      vw.remove();
      this.vwRemoveTimeouts.splice(timeout, 1);
    }, 5000);

    this.vwRemoveTimeouts.push(timeout);
  }

  onAddMessage(md, cl) {
    const vw = new StatusMessageVw({ model: md });
    const duration = md.get('duration');

    this.msgViews = this.msgViews || [];
    this.$el.prepend(vw.render().el);
    this.registerChild(vw);
    this.msgViews.push(vw);

    setTimeout(() => {
      vw.$el.addClass('slideUp');
    }, 100);

    const timeout = setTimeout(() => {
      cl.remove(md);
      this.mdRemoveTimeouts.splice(timeout, 1);
    }, duration);

    this.mdRemoveTimeouts.push(timeout);
  }

  /**
   * Add a new status message.
   * @param {string|Object} msg - The message to be displayed. Defaults are driven by
      the StatusMessage model.
   * @param {string} msg.text - The text of the message to be displayed.
   * @param {string} [msg.type=msg] - Type of message. Available types are driven by the
      StatusMessage model.
   * @param {number} [msg.duration=2500] - The length of time before status msg is removed.
      Pass in a really large number if you rather remove the status msg yourself.
   * @return {object} An object with methods that control the the generated status msg.
   */
  pushMessage(msg) {
    if (!msg || typeof msg !== 'string' || typeof msg !== 'object') {
      throw new Error('Please provide a msg as a string or an object.');
    }

    const md = new StatusMessageMd(
      typeof msg === 'string' ? { msg } : msg
    );

    if (Object.keys(md.validationError).length) {
      throw new Error(Object.keys(md.validationError)[0]);
    }

    this.collection.add(md);

    const updateMessage = (message) => {
      if (!message) {
        throw new Error('Please provide a msg.');
      }

      if (typeof message === 'string') {
        md.set('msg', message);
      } else {
        // For now, duration can't be updated. If you desire to control the duration
        // programatically, pass in a really large duration with pushMessage and then
        // call remove() whenever it suits you.
        delete message.duration;
        md.set(message);
      }
    };

    return {
      remove: () => this.collection.remove(md),
      updateMessage,
    };
  }

  remove() {
    this.vwRemoveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.mdRemoveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.super();
  }
}
