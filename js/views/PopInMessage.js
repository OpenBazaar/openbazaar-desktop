import _ from 'underscore';
import $ from 'jquery';
import { capitalize } from '../utils/string';
import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';

export default class extends baseVw {
  constructor(options) {
    super(options);

    const opts = {
      dismissable: true,
      ...options,
    };

    this.options = opts;

    // Use messageText if you're providing inline content which the template
    // will wrap in a <p>. Otherwise, use messageHTML and provide the full markup.
    if (!options.messageText && !options.messageHTML) {
      throw new Error('Please provide a messageText or messageHTML');
    }

    if (options.messageText && options.messageHTML) {
      throw new Error('Please provide only one of messageText or messageHTML');
    }

    this._state = { ...opts };
  }

  className() {
    return 'popInMessage clrS border clrBr padSm tx5';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick(e) {
    // If any elements or their ancestors have a '.js-<class>' class,
    // we'll trigger a 'click<Class>' event from this view.
    const events = [];

    e.target.classList.forEach((className) => {
      if (className.startsWith('js-')) events.push(className.slice(3));
    });

    if (!events.length) {
      $(e.target).parents('div[class^="js-"], div[class*=" js-"]')
        .forEach(el => {
          el.classList.forEach((className) => {
            if (className.startsWith('js-')) events.push(className.slice(3));
          });
        });
    }

    if (events.length) {
      events.forEach(event => {
        this.trigger(`click${capitalize(event)}`, { view: this, e });
      });
    }
  }

  setState(state = {}) {
    const newState = {
      ...this._state,
      ...state,
    };

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }
  }

  replaceState(state = {}) {
    if (!_.isEqual(this._state, state)) {
      this._state = state;
      this.render();
    }
  }

  render() {
    loadTemplate('./popInMessage.html', (tmpl) => {
      this.$el.html(
        tmpl(this._state)
      );
    });

    return this;
  }
}
