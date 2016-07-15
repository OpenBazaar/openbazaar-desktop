import { View } from 'backbone';
import loadTemplate from '../utils/loadTemplate';

export default class Settings extends View {
  constructor(options = {}) {
    super({
      className: 'settings',
      events: {

      },
      ...options
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

  openSubView(sView = this.currentSubView){

  }

  resetSubView(sView = this.currentSubView){
    //set tab back to its previous values
  }

  saveSubView(sView = this.currentSubView){

  }

  close(){
    //closes the parent modal
  }
}

