import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'settings',
      events: {

      },
      ...options,
    });
    this.options = options;
  }

  render() {
    loadTemplate('settings.html', (t) => {
      this.$el.html(t({
      }));
    });

    return this;
  }

  openSubView(sView = this.currentSubView) {
    console.log(sView); // open the sView
  }

  resetSubView(sView = this.currentSubView) {
    // set tab back to its previous values
    console.log(sView); // open the sView
  }

  saveSubView(sView = this.currentSubView) {
    console.log(sView); // open the sView
  }

  close() {
    // closes the parent modal
    console.log('close the modal');
  }
}

