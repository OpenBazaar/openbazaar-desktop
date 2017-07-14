import 'cropit';
import '../../../lib/select2';
import app from '../../../app';
import { getCurrentConnection } from '../../../utils/serverConnect';
// import Settings from '../../../models/Settings';
// import Profile from '../../../models/profile/Profile';
import { getTranslatedCountries } from '../../../data/countries';
import { getTranslatedCurrencies } from '../../../data/currencies';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      initialState: {
        screen: 'intro',
        screen: 'info',
        ...options.initialState,
      },
      ...options,
    };

    // if (!(options.profile instanceof Profile)) {
    //   throw new Error('Please provide our own Profile model.');
    // }

    // if (!(options.settings instanceof Settings)) {
    //   throw new Error('Please provide our own Settings model.');
    // }

    super(opts);
    this.options = opts;
    this.screens = ['intro', 'info', 'tos'];
    this.lastAvatarImageRotate = 0;
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

    this.setState({
      screen: this.screens[this.screens.indexOf(curScreen) - 1],
    });
  }

  onClickNavNext() {
    const curScreen = this.getState().screen;

    this.setState({
      screen: this.screens[this.screens.indexOf(curScreen) + 1],
    });
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
          // this.$('#onboardingCountry').select2();
          this.getCachedEl('#onboardingCurrency').select2();

          setTimeout(() => {
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
