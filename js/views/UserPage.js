import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import Dialog from './modals/Dialog';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    if (!options.model) {
      throw new Error('Please provide a Profile model');
    }

    this.options = options;
  }

  render() {
    loadTemplate('userPage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        tab: this.options.tab || '',
        category: this.options.category || '',
        layer: this.options.layer || '',
      }));
    });

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

    return this;
  }
}
