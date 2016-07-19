import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';
import TestModal from './modals/Test';
import Dialog from './modals/Dialog';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  events() {
    return {
      'click .launchCustomModal': 'onClickCustom',
      'click .launchSimpleMessageModal': 'onClickSimple',
      'click .launchDialog': 'onClickDialog',
    };
  }

  onClickCustom() {
    new TestModal().render().open();
  }

  onClickSimple() {
    app.simpleMessageModal.open('Who do you think you are?',
      'I seemed to have misplaced my shoes and glasses.');
  }

  onClickDialog() {
    new Dialog({
      title: 'Houston, We Have A problem!',
      message: 'How can you eat your pudding, if you haven\'t eaten your meat!?',
      buttons: [{
        text: 'OK',
        fragment: 'ok',
      }, {
        text: 'Cancel',
        fragment: 'cancel',
      }],
    }).render()
    .open()
    .on('click-ok', () => {
      alert('You clicked OK');
    })
    .on('click-cancel', () => {
      alert('You clicked cancel');
    });
  }

  render() {
    loadTemplate('testModals.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
