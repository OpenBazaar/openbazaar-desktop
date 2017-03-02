// import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import { getEmojiGroups } from '../../data/emojis';
import baseVw from '../baseVw';

export default class extends baseVw {
  // constructor(options = {}) {
  //   if (!options.model) {
  //     throw new Error('Please provide a model.');
  //   }

  //   super(options);
  //   this.profile = options.profile;

  //   this.listenTo(this.model, 'change', this.render);
  // }

  className() {
    return 'emojiMenu';
  }

  // events() {
  //   return {
  //     click: 'onClick',
  //   };
  // }

  render() {
    loadTemplate('chat/emojiMenu.html', (t) => {
      this.$el.html(t({
        groups: getEmojiGroups(),
      }));
    });

    return this;
  }
}
