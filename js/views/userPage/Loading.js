import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from '../modals/BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      ...options,
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
      removeOnClose: false,
      removeOnRoute: true,
      initialState: {
        userName: '',
        contentText: '',
        isProcessing: false,
        ownAvatarHashes: app.profile && app.profile.get('avatarHashes').toJSON() ||
          undefined,
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'userLoadingModal modal modalMedium modalScrollPage';
  }

  events() {
    return {
      'click .js-btnCancel': 'onClickCancel',
      'click .js-btnRetry': 'onClickBtnRetry',
    };
  }

  onClickCancel() {
    this.trigger('clickCancel');
  }

  onClickBtnRetry() {
    this.trigger('clickRetry');
  }

  render() {
    loadTemplate('userPage/loading.html', t => {
      this.$el.html(t(this.getState()));
      super.render();
    });

    return this;
  }
}
