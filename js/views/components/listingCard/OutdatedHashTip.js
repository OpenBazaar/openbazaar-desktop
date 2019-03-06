import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  events() {
    return {
      'click .js-reload': 'onClickReload',
    };
  }

  onClickReload() {
    console.log('boom');
    this.trigger('click-reload');
  }

  render() {
    loadTemplate('components/listingCard/outdatedHashTip.html', (t) => {
      this.$el.html(t());
    });

    return this;
  }
}
