import $ from 'jquery';
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

    this.listenTo(this.model, 'change', () => this.render());
    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'configuration';
  }

  events() {
    return {
      'click .js-btnConnect': 'onConnectClick',
      'click .js-btnDisconnect': 'onDisconnectClick',
      'click .js-btnCancel': 'onCancelClick',
      'click .js-btnEdit': 'onEditClick',
      'click .js-btnDelete': 'onDeleteClick',
      'click .js-deleteConfirmYes': 'onDeleteConfirm',
      'click .js-deleteConfirmCancel': 'onDeleteConfirmCancel',
    };
  }

  onDocumentClick(e) {
    if (this.getState().deleteConfirmOn &&
      !($.contains(this.$deleteConfirm[0], e.target) ||
        e.target === this.$deleteConfirm[0])) {
      this.setState({ deleteConfirmOn: false });
    }
  }

  onConnectClick() {
    this.trigger('connectClick', { view: this });
  }

  onDisconnectClick() {
    this.trigger('disconnectClick', { view: this });
  }

  onCancelClick() {
    this.trigger('cancelClick', { view: this });
  }

  onEditClick() {
    this.trigger('editClick', { view: this });
  }

  onDeleteClick() {
    const isDeleteOn = this.getState().deleteConfirmOn;

    this.setState({ deleteConfirmOn: true });

    if (!isDeleteOn) {
      // If the delete confirm wasn't on, we will now show it
      // and we don't want this click event to bubble to our
      // document clieck handler, otherwise it will close the
      // confirm callout that we are showing here.
      return false;
    }

    return true;
  }

  onDeleteConfirm() {
    this.model.destroy();
    this.setState({ deleteConfirmOn: false });
  }

  onDeleteConfirmCancel() {
    this.setState({ deleteConfirmOn: false });
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

  get $deleteConfirm() {
    return this._$deleteConfirm ||
      (this._$deleteConfirm = this.$('.js-deleteConfirm'));
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    loadTemplate('modals/connectionManagement/configuration.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        ...this._state,
      }));

      this._$deleteConfirm = null;
    });

    return this;
  }
}
