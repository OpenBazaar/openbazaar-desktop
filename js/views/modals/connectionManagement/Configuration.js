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
      'click .js-btnCancel': 'onCancelClick',
      'click .js-btnEdit': 'onEditClick',
      'click .js-btnDelete': 'onDeleteClick',
      'click .js-deleteConfirmYes': 'onDeleteConfirm',
      'click .js-deleteConfirmCancel': 'onDeleteConfirmCancel',
    };
  }

  onConnectClick() {
    this.trigger('connectClick', { view: this });
  }

  onCancelClick() {
    this.trigger('cancelClick', { view: this });
  }

  onEditClick() {
    this.trigger('editClick', { view: this });
  }

  onDeleteClick() {
    this.setState({ deleteConfirmOn: true });
  }

  onDeleteConfirm() {
    this.trigger('delete', { view: this });
    this.setState({ deleteConfirmOn: false });
  }

  onDeleteConfirmCancel() {
    this.setState({ deleteConfirmOn: false });
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
    loadTemplate('modals/connectionManagement/configuration.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
      }));
    });

    return this;
  }
}
