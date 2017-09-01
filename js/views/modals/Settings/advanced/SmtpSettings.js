import $ from 'jquery';
import _ from 'underscore';
import app from '../../../../app';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import TestSmtpStatus from './TestSmtpStatus';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model) {
      throw new Error('Please provide a SMTPSettings model.');
    }
  }

  className() {
    return 'box padMdKids padStack clrP clrBr';
  }

  tagName() {
    return 'form';
  }

  get events() {
    return {
      'change [name=notifications]': 'onChangeShowSmtpNotifications',
      'click input[type=reset]': 'resetForm',
      'click .js-testSMTPSettings': 'onClickTest',
      'click .js-cancelSMTPSettings': 'onClickCancelTest',
    };
  }

  onChangeShowSmtpNotifications() {
    this.setModelData();
    this.render();
  }

  resetForm() {
    this.model.set({
      ..._.omit(this.model.defaults(), 'notifications'),
    });
    if (this.testSmtpPost) this.testSmtpPost.abort();
    if (this.testSmtpStatus) {
      this.testSmtpStatus.setState({
        isFetching: false,
        msg: '',
      });
    }
    this.render();
  }

  onClickTest() {
    if (this.testSmtpPost) this.testSmtpPost.abort();
    this.setModelData();
    this.model.set({}, { validate: true });
    this.testSmtpStatus.setState({ msg: '' });

    if (this.model.validationError) {
      this.render();
      return;
    }

    this.testSmtpPost = $.post({
      url: app.getServerUrl('ob/testemailnotifications'),
      data: JSON.stringify(this.model.toJSON()),
      dataType: 'json',
      contentType: 'application/json',
    }).done(() => {
      this.testSmtpStatus.setState({
        success: true,
        msg: app.polyglot.t('settings.advancedTab.smtp.testSmtpSuccess'),
      });
    }).fail(xhr => {
      if (xhr.statusText === 'abort') return;
      const err = xhr.responseJSON && xhr.responseJSON.reason || '';
      const msg = err ?
        app.polyglot.t('settings.advancedTab.smtp.testSmtpFailWithError', { err }) :
        app.polyglot.t('settings.advancedTab.smtp.testSmtpFail');

      this.testSmtpStatus.setState({
        success: false,
        msg,
      });
    })
    .always(() => {
      this.getCachedEl('.js-smtpTestButtonWrap')
        .removeClass('testInProgress');
    });

    this.render();
  }

  onClickCancelTest() {
    if (this.testSmtpPost) this.testSmtpPost.abort();
    this.getCachedEl('.js-smtpTestButtonWrap')
      .removeClass('testInProgress');
  }

  // Sets the model based on the current data in the UI.
  setModelData(options = {}) {
    this.model.set(this.getFormData(), options);
  }

  remove() {
    if (this.testSmtpPost) this.testSmtpPost.abort();
    super.remove();
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/smtpSettings.html', (t) => {
      this.$el.html(t({
        errors: this.model.validationError || {},
        testingSmtp: this.testSmtpPost && this.testSmtpPost.state() === 'pending',
        ...this.model.toJSON(),
      }));

      const testSmtpStatusInitialState = {
        ...(this.testSmtpStatus && this.testSmtpStatus.getState() || {}),
      };

      if (this.testSmtpStatus) this.testSmtpStatus.remove();
      this.testSmtpStatus = this.createChild(TestSmtpStatus, {
        initialState: {
          ...testSmtpStatusInitialState,
        },
      });
      this.getCachedEl('.js-testSmtpStatusContainer').html(this.testSmtpStatus.render().el);
    });

    return this;
  }
}
