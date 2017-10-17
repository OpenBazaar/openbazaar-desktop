import loadTemplate from '../../utils/loadTemplate';
import PopInMessage from '../components/PopInMessage';

export default class extends PopInMessage {
  render() {
    loadTemplate('./transactions/resyncPopInMessage.html', (tmpl) => {
      this.$el.html(
        tmpl(this._state)
      );
    });

    return this;
  }
}
