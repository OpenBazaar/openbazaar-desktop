import $ from 'jquery';
import openSimpleMessage from '../SimpleMessage';
import { getCurrentConnection } from '../../../utils/serverConnect';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!opts.model) {
      throw new Error('Please provide a model.');
    }

    const curConn = getCurrentConnection();
    this.showConfigureTorMessage = false;
    this.showTorUnavailableMessage = false;

    if (curConn && curConn.server && curConn.server.id === options.model.id) {
      if (curConn.reason === 'tor-not-configured') {
        this.showConfigureTorMessage = true;
      } else if (curConn.reason === 'tor-not-available') {
        this.showTorUnavailableMessage = true;
      }
    }

    this._lastSavedAttrs = this.model.toJSON();

    this.title = this.model.isNew() ?
      app.polyglot.t('connectionManagement.configurationForm.tabName') :
      this.model.get('name');

    this.listenTo(this.model, 'change:name', () => {
      const newName = this.model.get('name');
      if (newName) this.title = newName;
    });

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  className() {
    return 'configurationForm';
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
      'click .js-save': 'onSaveClick',
      'click .js-saveConfirmed': 'onSaveConfirmedClick',
      'click .js-saveConfirmBox': 'onClickSaveConfirmBox',
      'click .js-saveConfirmCancel': 'onClickSaveConfirmCancel',
      'change #serverConfigServerIp': 'onChangeServerIp',
      'change [name=useTor]': 'onChangeUseTor',
      'change [name=serverType]': 'onChangeServerType',
      'click .js-inUseText': 'onClickInUseText',
    };
  }

  onDocumentClick() {
    this.getCachedEl('.js-saveConfirmBox').addClass('hide');
  }

  onClickSaveConfirmBox(e) {
    // Do not allow clicks to get to the doc handler and result in the
    // confirm box closing.
    e.stopPropagation();
  }

  onClickSaveConfirmCancel() {
    this.getCachedEl('.js-saveConfirmBox').addClass('hide');
  }

  onCancelClick() {
    this.trigger('cancel', { view: this });
  }

  onSaveClick(e) {
    this.setModelFromForm();
    this.model.set({}, { validate: true });

    if (this.model.validationError) {
      this.render();
      return;
    }

    if (!this.model.isLocalServer() && !this.model.get('SSL')) {
      this.getCachedEl('.js-saveConfirmBox').removeClass('hide');
    } else {
      this.save();
    }

    // don't bubble to the doc handler
    e.stopPropagation();
  }

  onSaveConfirmedClick() {
    this.save();
  }

  onChangeServerIp(e) {
    this.model.set(this.getFormData(e.target));

    if (this.model.isLocalServer()) {
      // it's a local ip
      this.$usernameLabel.add(this.$passwordLabel)
        .removeClass('required');
    } else {
      this.$usernameLabel.add(this.$passwordLabel)
        .addClass('required');

      // If you switched from a local to a remote IP, we'll default SSL
      // to on.
      if (this.model.isLocalServer(this.model.previousAttributes().serverIp)) {
        this.getCachedEl('#serverConfigSSLOn')[0].checked = true;
      }
    }

    this.getCachedEl('.js-torPwLabel')
      .toggleClass('required', this.model.isTorPwRequired());
  }

  onChangeUseTor(e) {
    this.getCachedEl('form')
      .toggleClass('useTor', e.target.checked);
  }

  onChangeServerType(e) {
    this.getCachedEl('.js-standAloneSection')
      .toggleClass('hide', e.target.value === 'BUILT_IN');
  }

  onClickInUseText() {
    // prevents the click of the help icon from selecting the otherwise disabled radio
    return false;
  }

  setModelFromForm() {
    const serverType = this.getFormData(this.getCachedEl('[name=serverType]')).serverType;
    const builtIn = this.model.isNew() ? serverType === 'BUILT_IN' : this.model.get('builtIn');
    const formFieldsDataAttr = builtIn ? 'data-field-builtin' : 'data-field-standalone';
    const formData = this.getFormData(
      this.getCachedEl(`select[${formFieldsDataAttr}], input[${formFieldsDataAttr}], ` +
        `textarea[${formFieldsDataAttr}]`)
    );
    delete formData.serverType;
    this.model.set({
      ...this.model.lastSyncedAttrs || {},
      ...formData,
      confirmedTor: this.model.get('confirmedTor') || formData.useTor ||
        this.showConfigureTorMessage,
      builtIn,
    });
  }

  /**
   * Save() assumes that you've previously called setModelFromForm to sync the model
   * from the UI.
   */
  save() {
    const save = this.model.save();

    if (save) {
      save.done(() => {
        this._lastSavedAttrs = this.model.toJSON();
        this.trigger('saved', { view: this });
      }).fail(() => {
        // since we're saving to localStorage this really shouldn't happen
        openSimpleMessage('Unable to save server configuration');
      });
    }

    this.render();
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$('select[name], input[name], textarea[name]'));
  }

  get $usernameLabel() {
    return this._$usernameLabel ||
      (this._$usernameLabel = this.$('.js-usernameLabel'));
  }

  get $passwordLabel() {
    return this._$passwordLabel ||
      (this._$passwordLabel = this.$('.js-passwordLabel'));
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/connectionManagement/configurationForm.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        isRemote: !this.model.isLocalServer(),
        title: this.title,
        showConfigureTorMessage: this.showConfigureTorMessage,
        showTorUnavailableMessage: this.showTorUnavailableMessage,
        isTorPwRequired: this.model.isTorPwRequired(),
      }));

      this._$formFields = null;
      this._$usernameLabel = null;
      this._$passwordLabel = null;

      if (!this.rendered) {
        this.rendered = true;
        setTimeout(() => {
          if (!this.showConfigureTorMessage && !this.showTorUnavailableMessage) {
            this.getCachedEl('.js-inputName').focus();
          }
        });
      }
    });

    return this;
  }
}
