import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a server configuration model.');
    }

    super(options);

    this._state = {
      status: 'not-connected',
      ...options.initialState || {},
    };
  }

  className() {
    return 'configuration';
  }

  events() {
    return {
      'click .js-btnConnect': 'onConnectClick',
    };
  }

  onConnectClick() {
    this.trigger('connectClick', { view: this });
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
  }

  render() {
    console.log(JSON.parse(JSON.stringify(this._state)));
    loadTemplate('modals/connectionManagement/configuration.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
      }));
    });

    return this;
  }
}
