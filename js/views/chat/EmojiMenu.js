import $ from 'jquery';
import twemoji from 'twemoji';
import { getEmojiGroups } from '../../data/emojis';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  className() {
    return 'emojiMenu';
  }

  events() {
    return {
      'click .js-emoji': 'onClickEmoji',
    };
  }

  onClickEmoji(e) {
    const $emojiEl = $(e.target).closest('button')
      .find('.emoji');

    this.trigger('emojiSelected', { emoji: $emojiEl.attr('alt') });
  }

  render() {
    loadTemplate('chat/emojiMenu.html', (t) => {
      const content = t({
        groups: getEmojiGroups(),
      });

      // Let's process the content through Twemoji before adding it to the DOM.
      this.$el.html(twemoji.parse(content,
        icon => (`../imgs/emojis/72X72/${icon}.png`)));
    });

    return this;
  }
}
