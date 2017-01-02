import _ from 'underscore';
import { capitalize } from '../../../utils/string';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      msg: '',
      ...options.initialState || {},
    };
  }

  className() {
    return 'statusBarMessage ';
  }

  events() {
    return {
      'click .js-btnClose': 'onClickClose',
      'click .statusMsg [class^="js-"], .statusMsg [class*=" js-"]': 'onMsgContentClick',
    };
  }

  onClickClose() {
    this.trigger('closeClick');
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
    loadTemplate('modals/connectionManagement/statusBar.html', (t) => {
      this.$el.html(t(this._state));
    });

    return this;
  }
}
