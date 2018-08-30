import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

/*
Used to show a dialog with optional buttons. By default, the dialog removes itself on close. In it's
simplest form a dialog can be launched as follows:

const myDialog = new Dialog({
  title: 'Houston, We Have A problem!',
  message: 'How can you eat your pudding, if you haven't eaten your meat!?'
}).render().open();

Additionally, you could specify an array of buttons which will be displayed at the bottom of the
dialog. The buttons should be provided in the following format:

{
  title: '...',
  ...
  buttons: [{
    text: 'Cancel', // displayed text of button
    fragment: 'cancel' // unique fragment to identify the button. Used internally, as well as
                       // used to determine the event that will be fire upon click of the button,
                       // e.g. the above fragment would result in 'click-cancel'.
  },{
    text: 'Ok',
    fragment: 'ok'
  }]
}

Please Note: This Dialog is designed for simple messages with optional classes or buttons on
the bottom. If you find that your situation needs custom markup, css (beyond the classes you
can optionally pass in) and/or behavior (e.g. tabs, etc.), you should write a custom view
and extend from the Base Modal.

Also, if it's just a super simple message you need, please check out the SimpleMessageModal.
*/

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      title: '',
      message: '',
      titleClass: '',
      messageClass: '',
      buttons: [],
      removeOnClose: true,
      defaultBtnClass: 'flexExpand btnFlx clrP',
      ...options,
    };

    super(opts);
    this.options = opts;

    const events = {};

    if (opts.buttons && opts.buttons.length) {
      opts.buttons.forEach((btn) => {
        const serializedBut = JSON.stringify(btn);

        if (!btn.text || !btn.fragment) {
          throw new Error(`The button, '${serializedBut.slice(0, 10)}', is missing `
            + 'either a text or fragment property. Both are required.');
        }

        btn.className = btn.className === undefined ? opts.defaultBtnClass : btn.className;

        events[`click .js-${btn.fragment}`] = 'onBtnClick';
      });

      this.events = () => ({ ...super.events() || {}, ...events });
      this.delegateEvents(this.events);
    }
  }

  className() {
    return `${super.className()} messageModal dialog`;
  }

  onBtnClick(e) {
    this.trigger(`click-${$(e.target).data('event-name')}`);
  }

  render() {
    loadTemplate('modals/dialog.html', (t) => {
      this.$el.html(t(this.options));

      super.render();
    });

    return this;
  }
}
