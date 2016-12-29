import _ from 'underscore';
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
    };
  }

  onClickClose() {
    this.trigger('closeClick');
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
