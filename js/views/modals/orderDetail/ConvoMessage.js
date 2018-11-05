import $ from 'jquery';
import moment from 'moment';
import twemoji from 'twemoji';
import { capitalize } from '../../../utils/string';
import { setTimeagoInterval } from '../../../utils/';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super({
      ...options,
      initialState: {
        showAvatar: true,
        showTimestampLine: true,
        showAsRead: false,
        ...options.initialState,
      },
    });

    this.listenTo(this.model, 'change', () => this.render());
    this.timeAgoInterval = setTimeagoInterval(this.model.get('timestamp'), () => {
      const timeAgo = moment(this.model.get('timestamp')).fromNow();
      if (timeAgo !== this.renderedTimeAgo) this.render();
    });
  }

  className() {
    return 'convoMessage';
  }

  remove() {
    this.timeAgoInterval.cancel();
    super.remove();
  }

  render() {
    let message = this.model.get('message');

    // Give any links the emphasis color.
    const $msgHtml = $(`<div>${message}</div>`);

    $msgHtml.find('a')
      .addClass('clrTEm');

    // Convert any unicode emoji characters to images via Twemoji
    message = twemoji.parse($msgHtml.html(),
      icon => (`../imgs/emojis/72X72/${icon}.png`));

    loadTemplate('modals/orderDetail/convoMessage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
        moment,
        message,
        capitalize,
        ownGuid: app.profile.id,
      }));
    });

    return this;
  }
}
