import $ from 'jquery';
import 'cropit';
import '../../../lib/select2';
import app from '../../../app';
import { getCurrentConnection } from '../../../utils/serverConnect';
import { getTranslatedCountries } from '../../../data/countries';
import { getTranslatedCurrencies } from '../../../data/currencies';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      initialState: {
        screen: 'intro',
        saveInProgress: false,
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.screens = ['intro', 'info', 'tos'];
    this.lastAvatarImageRotate = 0;
    this.avatarChanged = false;
    this.countryList = getTranslatedCountries(app.settings.get('language'));
    this.currencyList = getTranslatedCurrencies(app.settings.get('language'));
  }

  className() {
    return `${super.className()} onboarding modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-changeServer': 'onClickChangeServer',
      'click .js-getStarted': 'onClickGetStarted',
      'click .js-navBack': 'onClickNavBack',
      'click .js-navNext': 'onClickNavNext',
      'click .js-avatarLeft': 'onAvatarLeftClick',
      'click .js-avatarRight': 'onAvatarRightClick',
      'click .js-changeAvatar': 'onClickChangeAvatar',
      'click .js-tosAgree': 'onClickTosAgree',
      ...super.events(),
    };
  }

  onClickChangeServer() {
    app.connectionManagmentModal.open();
  }

  onClickGetStarted() {
    this.setState({ screen: 'info' });
  }

  onClickNavBack() {
    const curScreen = this.getState().screen;
    const newScreen = this.screens[this.screens.indexOf(curScreen) - 1];

    if (curScreen === 'info') {
      this.setModelsFromForm();
    }

    this.setState({
      screen: newScreen,
    });
  }

  onClickNavNext() {
    const curScreen = this.getState().screen;
    const newScreen = this.screens[this.screens.indexOf(curScreen) + 1];

    if (curScreen === 'info') {
      this.setModelsFromForm();

      if (newScreen === 'tos') {
        app.profile.set({}, { validate: true });
        app.settings.set({}, { validate: true });

        if (app.settings.validationError || app.profile.validationError) {
          this.render();
          return;
        }
      }
    }

    this.setState({ screen: newScreen });
  }

  onClickChangeAvatar() {
    this.getCachedEl('#avatarInput')[0].click();
  }

  onAvatarLeftClick() {
    this.avatarRotate(-1);
  }

  onAvatarRightClick() {
    this.avatarRotate(1);
  }

  onClickTosAgree() {
    this.setState({ saveInProgress: true });

    const profileSave = app.profile.save({}, {
      type:
        Object.keys(app.profile.lastSyncedAttrs).length ?
          'PUT' : 'POST',
    });

    const settingsSave = app.settings.save({}, {
      type:
        Object.keys(app.settings.lastSyncedAttrs).length ?
          'PUT' : 'POST',
    });

    const saves = [profileSave, settingsSave];

    if (this.avatarChanged) {
      const avatarSave = this.saveAvatar()
        .done(avatarData => app.profile.set('avatarHashes', avatarData));
      saves.push(avatarSave);
    }

    $.when(...saves).done(() => {
      this.trigger('onboarding-complete');
    }).fail((jqXhr) => {
      let title;

      if (jqXhr === profileSave) {
        title = app.polyglot.t('onboarding.profileFailedSaveTitle');
      } else if (jqXhr === settingsSave) {
        title = app.polyglot.t('onboarding.settingsFailedSaveTitle');
      } else {
        title = app.polyglot.t('onboarding.settingsFailedSaveAvatar');
      }

      openSimpleMessage(title, jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
    })
    .always(() => {
      this.setState({ saveInProgress: false });
    });
  }

  setModelsFromForm() {
    const $settingsFields = this.getCachedEl('select[data-model=settings], ' +
      'input[data-model=settings], textarea[data-model=settings]');
    app.settings.set(this.getFormData($settingsFields));
    const $profileFields = this.getCachedEl('select[data-model=profile], ' +
      'input[data-model=profile], textarea[data-model=profile]');
    app.profile.set(this.getFormData($profileFields));
  }

  saveAvatar() {
    if (!this.avatarExport) {
      throw new Error('Unable to save the avatar because the export ' +
        'data is not available');
    }

    const avatarData = JSON.stringify(
      { avatar: this.avatarExport.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });

    return $.ajax({
      type: 'POST',
      url: app.getServerUrl('ob/avatar/'),
      contentType: 'application/json; charset=utf-8',
      data: avatarData,
      dataType: 'json',
    });
  }

  avatarRotate(direction) {
    if (this.$avatarCropper.cropit('imageSrc')) {
      this.$avatarCropper.cropit(direction > 0 ? 'rotateCW' : 'rotateCCW');

      // normalize so this.lastAvatarImageRotate is a positive number between 0 and 3
      this.lastAvatarImageRotate = (this.lastAvatarImageRotate + direction) % 4;
      if (this.lastAvatarImageRotate === -1) {
        this.lastAvatarImageRotate = 3;
      } else if (this.lastAvatarImageRotate === -2) {
        this.lastAvatarImageRotate = 2;
      } else if (this.lastAvatarImageRotate === -3) {
        this.lastAvatarImageRotate = 1;
      }
    }
  }

  render() {
    if (this.$avatarCropper) {
      this.lastAvatarZoom = this.$avatarCropper.cropit('zoom');
      this.lastAvatarImageSrc = this.$avatarCropper.cropit('imageSrc');
      this.avatarExport = this.$avatarCropper.cropit('export', {
        type: 'image/jpeg',
        quality: 1,
        originalSize: true,
      });
      this.$avatarCropper = null;
    }

    this.clearCachedElementMap();

    loadTemplate('modals/onboarding/onboarding.html', t => {
      loadTemplate('brandingBox.html', brandingBoxT => {
        const state = this.getState();

        this.$el.html(t({
          brandingBoxT,
          ...state,
          curConn: getCurrentConnection(),
          profile: app.profile.toJSON(),
          profileErrors: app.profile.validationError || {},
          profileConstraints: app.profile.max,
          settings: app.settings.toJSON(),
          settingsErrors: app.settings.validationError || {},
          countryList: this.countryList,
          currencyList: this.currencyList,
        }));

        if (state.screen === 'info') {
          setTimeout(() => {
            this.getCachedEl('#onboardingCountry').select2();
            this.getCachedEl('#onboardingCurrency').select2();

            this.$avatarCropper = this.getCachedEl('#avatarCropper').cropit({
              $preview: this.getCachedEl('.js-avatarPreview'),
              $fileInput: this.getCachedEl('#avatarInput'),
              smallImage: 'stretch',
              allowDragNDrop: false,
              maxZoom: 2,
              onImageLoaded: () => {
                this.getCachedEl('.js-avatarLeft').removeClass('disabled');
                this.getCachedEl('.js-avatarRight').removeClass('disabled');
                this.getCachedEl('.js-avatarZoom').removeClass('disabled');
                this.$avatarCropper.cropit('zoom', this.lastAvatarZoom);

                for (let i = 0; i < this.lastAvatarImageRotate; i++) {
                  this.$avatarCropper.cropit('rotateCW');
                }
              },
              onFileChange: () => {
                this.lastAvatarImageRotate = 0;
                this.lastAvatarImageSrc = '';
                this.lastAvatarZoom = 0;
                this.avatarChanged = true;
              },
              onFileReaderError: (data) => {
                console.log('file reader error');
                console.log(data);
              },
              onImageError: (errorObject) => {
                console.log(errorObject.code);
                console.log(errorObject.message);
              },
              imageState: {
                src: this.lastAvatarImageSrc || '',
              },
            });
          }, 0);
        }
      });
    });
    super.render();

    return this;
  }
}
