import _ from 'underscore';
import { capitalize } from '../../utils/string';
import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);

    this._state = {
      ...options.initialState || {},
    };
  }

  className() {
    return `${super.className()} loadingModal startupLoadingModal clrP clrT`;
  }

  events() {
    return {
      'click .js-msg [class^="js-"], .js-msg [class*=" js-"]': 'onMsgContentClick',
    };
  }

  // User of this view may embed CTA's in the msg. This is a generic handler to
  // trigger events for them.
  onMsgContentClick(e) {
    // If the the el has a '.js-<class>' class, we'll trigger a
    // 'click<Class>' event from this view.
    const events = [];

    e.currentTarget.classList.forEach((className) => {
      if (className.startsWith('js-')) events.push(className.slice(3));
    });

    if (events.length) {
      events.forEach(event => {
        this.trigger(`click${capitalize(event)}`, { view: this, e });
      });
    }
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('modals/startupLoading.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));

      super.render();
    });

    return this;
  }
}
