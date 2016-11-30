import { Events } from 'backbone';
import baseVw from './baseVw';
import StatusMessageMd from '../models/StatusMessage';
import StatusMessages from '../collections/StatusMessages';
import StatusMessageVw from './StatusMessage';

export default class extends baseVw {
  constructor() {
    super();
    this.collection = new StatusMessages();
    this.vwRemoveTimeouts = [];
    this.mdRemoveTimeouts = [];
    this.listenTo(this.collection, 'remove', this.onRemoveMessage);
  }

  onRemoveMessage(md, cl, opts) {
    const vw = this.msgViews.splice(opts.index, 1)[0];

    vw.$el.removeClass('slideUp');

    // give any animations some time to complete and then remove the view
    const timeout = setTimeout(() => {
      vw.remove();
      this.vwRemoveTimeouts.splice(timeout, 1);
    }, 50000);

    this.vwRemoveTimeouts.push(timeout);
  }

  /* Internal method used by pushMessage to add a new status message. Use pushMessage publicly. */
  addMessage(md, View = StatusMessageVw) {
    if (!md) {
      throw new Error('Please provide a model.');
    }

    const vw = new View({ model: md });

    if (!(vw instanceof StatusMessageVw)) {
      throw new Error('The view must be an instance of the StatusMessageVw.');
    }

    const duration = md.get('duration');

    this.collection.add(md);
    this.msgViews = this.msgViews || [];
    this.$el.prepend(vw.render().el);
    this.registerChild(vw);
    this.msgViews.push(vw);

    setTimeout(() => {
      vw.$el.addClass('slideUp');
    }, 100);

    const timeout = setTimeout(() => {
      this.collection.remove(md);
      this.mdRemoveTimeouts.splice(timeout, 1);
    }, duration);

    this.mdRemoveTimeouts.push(timeout);

    return vw;
  }

  /**
   * Add a new status message.
   * @param {string|Object} msg - The status message to be displayed. Defaults are driven
      by the StatusMessage model.
   * @param {string} msg.msg - The text of the message to be displayed.
   * @param {string} [msg.type=msg] - Type of message. Available types are driven by the
      StatusMessage model.
   * @param {number} [msg.duration=2500] - The length of time before status msg is removed.
      Pass in a really large number if you rather remove the status msg yourself.
   * @return {object} An object with methods that control the the generated status msg.
   */
  pushMessage(msg) {
    if (!msg || (typeof msg !== 'string' && typeof msg !== 'object')) {
      throw new Error('Please provide a msg as a string or an object.');
    }

    const msgObj = typeof msg === 'string' ? { msg } : msg;
    const md = new StatusMessageMd();
    md.set(msgObj, { validate: true });

    if (Object.keys(md.validationError || {}).length) {
      throw new Error(md.validationError[Object.keys(md.validationError)[0]]);
    }

    const update = (message) => {
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

    const vw = this.addMessage(md, msgObj.View);

    const returnObj = {
      remove: () => this.collection.remove(md),
      update,
      ...Events,
    };

    // Proxy through events so our returned object passes through
    // any click events.
    vw.on('all', (event, ...args) => (returnObj.trigger(event, ...args)));

    return returnObj;
  }

  remove() {
    this.vwRemoveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.mdRemoveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.super();
  }
}
