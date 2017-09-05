import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import twemoji from 'twemoji';
import { setTimeagoInterval } from '../../utils/';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);

    this._state = {
      showAvatar: true,
      showTimestampLine: true,
      showAsRead: false,
      ...options.initialState || {},
    };

    this.listenTo(this.model, 'change', () => this.render());

    this.timeAgoInterval = setTimeagoInterval(this.model.get('timestamp'), () => {
      const timeAgo = moment(this.model.get('timestamp')).fromNow();
      if (timeAgo !== this.renderedTimeAgo) this.render();
    });
  }

  className() {
    return 'convoMessage';
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    let message = this.model.get('message');
    this.renderedTimeAgo = moment(this.model.get('timestamp')).fromNow();

    // Give any links the emphasis color.
    const $msgHtml = $(`<div>${message}</div>`);

    $msgHtml.find('a')
      .addClass('clrTEm');

    // Convert any unicode emoji characters to images via Twemoji
    message = twemoji.parse($msgHtml.html(),
      icon => (`../imgs/emojis/72X72/${icon}.png`));

    loadTemplate('chat/convoMessage.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
        moment,
        message,
        renderedTimeAgo: this.renderedTimeAgo,
        ownGuid: app.profile.id,
      }));
    });

    return this;
  }
}
