import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';
import '../../../lib/whenAll.jquery';
import { openSimpleMessage } from '../SimpleMessage';
import 'cropit';
import { installRichEditor } from '../../../utils/lib/trumbowyg';
import SocialAccounts from './SocialAccounts';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsPage',
      ...options,
    });

    this.avatarMinWidth = 280;
    this.avatarMinHeight = 280;
    this.headerMinWidth = 2450;
    this.headerMinHeight = 700;

    this.profile = app.profile.clone();

    // Sync our clone with any changes made to the global profile.
    this.listenTo(app.profile, 'someChange',
      (md, opts) => this.profile.set(opts.setAttrs));

    // Sync the global profile with any changes we save via our clone.
    this.listenTo(this.profile, 'sync',
      (md, resp, syncOpts) => app.profile.set(this.profile.toJSON(syncOpts.attrs)));

    this.socialAccounts = this.createChild(SocialAccounts, {
      collection: this.profile.get('contactInfo').get('social'),
      maxAccounts: this.profile.get('contactInfo').maxSocialAccounts,
    });
  }

  events() {
    return {
      'click .js-save': 'save',
      'click .js-avatarLeft': 'avatarLeftClick',
      'click .js-avatarRight': 'avatarRightClick',
      'click .js-headerLeft': 'headerLeftClick',
      'click .js-headerRight': 'headerRightClick',
      'change .js-colorPicker': 'handleColorChosen',
      'change .js-colorCode': 'handleColorCodeEntered',
    };
  }

  /** Handles when a hex color code is entered by updating color picker. */
  handleColorCodeEntered(event) {
    const colorPickerId = this.$(event.target).data('color-picker-id');
    const $colorPicker = this.getCachedEl(colorPickerId);
    const newHexColorCode = event.target.value;

    // If the text passes a basic RegExp for a valid 6 digit hex value,
    // update the color picker's color.
    if (/^#([0-9a-f]{6})$/i.test(newHexColorCode)) {
      $colorPicker.val(newHexColorCode);
    }
  }

  /** Handles when a color is chosen from the color picker by updating hex color code text. */
  handleColorChosen(event) {
    const hexInputId = this.$(event.target).data('hex-input-id');
    const $hexInput = this.getCachedEl(hexInputId);
    const newColor = event.target.value;

    $hexInput.val(newColor);
  }

  avatarRotate(direction) {
    if (this.avatarCropper.cropit('imageSrc')) {
      this.avatarCropper.cropit(direction > 0 ? 'rotateCW' : 'rotateCCW');
      this.avatarChanged = true;
    }
  }

  avatarLeftClick() {
    this.avatarRotate(-1);
  }

  avatarRightClick() {
    this.avatarRotate(1);
  }

  headerRotate(direction) {
    if (this.headerCropper.cropit('imageSrc')) {
      this.headerCropper.cropit(direction > 0 ? 'rotateCW' : 'rotateCCW');
      this.headerChanged = true;
    }
  }

  headerLeftClick() {
    this.headerRotate(-1);
  }

  headerRightClick() {
    this.headerRotate(1);
  }

  saveHeader() {
    const imageURI = this.headerCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 1,
      originalSize: true,
    });
    const headerData = JSON.stringify(
      { header: imageURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });
    return $.ajax({
      type: 'POST',
      url: app.getServerUrl('ob/header/'),
      contentType: 'application/json; charset=utf-8',
      data: headerData,
      dataType: 'json',
    });
  }

  saveAvatar() {
    const imageURI = this.avatarCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 1,
      originalSize: true,
    });
    const avatarData = JSON.stringify(
      { avatar: imageURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });
    return $.ajax({
      type: 'POST',
      url: app.getServerUrl('ob/avatar/'),
      contentType: 'application/json; charset=utf-8',
      data: avatarData,
      dataType: 'json',
    });
  }

  getFormData() {
    const formData = super.getFormData(this.$formFields);

    while (formData.handle.startsWith('@')) {
      formData.handle = formData.handle.slice(1);
    }

    if (formData.colors) {
      Object.keys(formData.colors)
        .forEach((colorField) => {
          if (!formData.colors[colorField].startsWith('#')) {
            formData.colors[colorField] = `#${formData.colors[colorField]}`;
          }
        });
    }

    return formData;
  }

  save() {
    const formData = this.getFormData();

    // set the model data for the social accounts
    this.socialAccounts.setCollectionData();

    this.profile.set(formData);

    const save = this.profile.save();
    let saveAvatar;
    let saveHeader;

    if (save) {
      if (this.avatarOffsetOnLoad !== this.avatarCropper.cropit('offset') ||
        this.avatarZoomOnLoad !== this.avatarCropper.cropit('zoom')) {
        this.avatarChanged = true;
      }

      if (this.headerOffsetOnLoad !== this.headerCropper.cropit('offset') ||
        this.headerZoomOnLoad !== this.headerCropper.cropit('zoom')) {
        this.headerChanged = true;
      }

      if (this.avatarChanged && this.avatarCropper.cropit('imageSrc')) {
        saveAvatar = this.saveAvatar();
        saveAvatar.done((avatarData) => {
          // set hash in profile to mirror the server copy
          this.profile.set('avatarHashes', avatarData);
          app.profile.set('avatarHashes', avatarData);
        });
      }

      if (this.headerChanged && this.headerCropper.cropit('imageSrc')) {
        saveHeader = this.saveHeader();
        saveHeader.done((headerData) => {
          // set hash in profile to mirror the server copy
          this.profile.set('headerHashes', headerData);
          app.profile.set('headerHashes', headerData);
        });
      }

      const msg = {
        msg: app.polyglot.t('settings.pageTab.statusSaving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      $.whenAll(save, saveAvatar, saveHeader)
        .done(() => {
          statusMessage.update({
            msg: app.polyglot.t('settings.pageTab.statusSaveComplete'),
            type: 'confirmed',
          });
        })
        .fail((args) => {
          const errMsg =
            args && args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';

          openSimpleMessage(app.polyglot.t('settings.pageTab.saveErrorAlertTitle'), errMsg);

          statusMessage.update({
            msg: app.polyglot.t('settings.pageTab.statusSaveFailed'),
            type: 'warning',
          });
        })
        .always(() => {
          this.$btnSave.removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
    }

    this.render();

    if (save) {
      this.$btnSave.addClass('processing');
    } else {
      const $firstErr = this.$('.errorList:first');

      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        this.trigger('unrecognizedModelError', this, [this.profile]);
      }
    }
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  render() {
    super.render();

    let avatarURI = false;
    let headerURI = false;

    // if this is a re-render, get the contents of the cropits
    if (this.avatarCropper) {
      avatarURI = this.avatarCropper.cropit('export', {
        type: 'image/jpeg',
        quality: 1,
        originalSize: true,
      });
    }

    if (this.headerCropper) {
      headerURI = this.headerCropper.cropit('export', {
        type: 'image/jpeg',
        quality: 1,
        originalSize: true,
      });
    }

    loadTemplate('modals/settings/page.html', (t) => {
      this.$el.html(t({
        errors: this.profile.validationError || {},
        ...this.profile.toJSON(),
        max: this.profile.max,
        avatarMinHeight: this.avatarMinHeight,
        avatarMinWidth: this.avatarMinWidth,
        headerMinHeight: this.headerMinHeight,
        headerMinWidth: this.headerMinWidth,
      }));

      const formFields = 'select[name], input[name], textarea[name], div[contenteditable][name]';
      this.$formFields = this.$(formFields);
      this._$btnSave = null;

      installRichEditor(this.$('#settingsAbout'), {
        topLevelClass: 'clrBr',
      });

      const avatarPrev = this.$('.js-avatarPreview');
      const avatarInpt = this.$('#avatarInput');
      this.avatarCropper = this.$('#avatarCropper');

      const headerPrev = this.$('.js-headerPreview');
      const headerInpt = this.$('#headerInput');
      this.headerCropper = this.$('#headerCropper');

      // if the avatar or header exist, don't count the first load as a change
      this.avatarLoadedOnRender =
        Boolean(avatarURI || this.profile.get('avatarHashes').get('original'));
      this.headerLoadedOnRender =
        Boolean(headerURI || this.profile.get('headerHashes').get('original'));

      setTimeout(() => {
        this.avatarCropper.cropit({
          $preview: avatarPrev,
          $fileInput: avatarInpt,
          smallImage: 'stretch',
          allowDragNDrop: false,
          maxZoom: 2,
          onImageLoaded: () => {
            this.avatarOffsetOnLoad = this.avatarCropper.cropit('offset');
            this.avatarZoomOnLoad = this.avatarCropper.cropit('zoom');
            this.$('.js-avatarLeft').removeClass('disabled');
            this.$('.js-avatarRight').removeClass('disabled');
            this.$('.js-avatarZoom').removeClass('disabled');
            this.avatarChanged = !this.avatarLoadedOnRender;
            this.avatarLoadedOnRender = false;
          },
          onFileReaderError: (data) => {
            console.log('file reader error');
            console.log(data);
          },
          onImageError: (errorObject) => {
            console.log(errorObject.code);
            console.log(errorObject.message);
          },
        });

        this.headerCropper.cropit({
          $preview: headerPrev,
          $fileInput: headerInpt,
          smallImage: 'stretch',
          allowDragNDrop: false,
          maxZoom: 2,
          onImageLoaded: () => {
            this.headerOffsetOnLoad = this.headerCropper.cropit('offset');
            this.headerZoomOnLoad = this.headerCropper.cropit('zoom');
            this.$('.js-headerLeft').removeClass('disabled');
            this.$('.js-headerRight').removeClass('disabled');
            this.$('.js-headerZoom').removeClass('disabled');
            this.headerChanged = !this.headerLoadedOnRender;
            this.headerLoadedOnRender = false;
          },
          onFileReaderError: (data) => {
            console.log('file reader error');
            console.log(data);
          },
          onImageError: (errorObject) => {
            console.log(errorObject.code);
            console.log(errorObject.message);
          },
        });

        if (avatarURI) {
          this.avatarCropper.cropit('imageSrc', avatarURI);
        } else if (this.profile.get('avatarHashes').get('original')) {
          this.avatarCropper.cropit('imageSrc',
            app.getServerUrl(`ob/images/${this.profile.get('avatarHashes').get('original')}`));
        }

        if (headerURI) {
          this.headerCropper.cropit('imageSrc', headerURI);
        } else if (this.profile.get('headerHashes').get('original')) {
          this.headerCropper.cropit('imageSrc',
            app.getServerUrl(`ob/images/${this.profile.get('headerHashes').get('original')}`));
        }
      }, 0);

      this.socialAccounts.delegateEvents();
      this.$('.js-socialAccounts').append(this.socialAccounts.render().el);
    });

    return this;
  }
}

