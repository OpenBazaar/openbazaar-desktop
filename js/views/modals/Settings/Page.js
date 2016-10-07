import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';
import '../../../lib/whenAll.jquery';
import SimpleMessage from '../SimpleMessage';
import 'cropit';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
        'click .js-avatarLeft': 'avatarLeftClick',
        'click .js-avatarRight': 'avatarRightClick',
        'click .js-headerLeft': 'headerLeftClick',
        'click .js-headerRight': 'headerRightClick',
      },
      ...options,
    });

    this.avatarMinWidth = 280;
    this.avatarMinHeight = 280;
    this.headerMinWidth = 2450;
    this.headerMinHeight = 700;

    this.profile = app.profile.clone();
    this.listenTo(this.profile, 'sync', () => app.profile.set(this.profile.toJSON()));
  }

  avatarLeftClick() {
    if (this.avatarCropper.cropit('imageSrc')) {
      this.avatarCropper.cropit('rotateCCW');
      this.avatarChanged = true;
    }
  }

  avatarRightClick() {
    if (this.avatarCropper.cropit('imageSrc')) {
      this.avatarCropper.cropit('rotateCW');
      this.avatarChanged = true;
    }
  }

  headerLeftClick() {
    if (this.headerCropper.cropit('imageSrc')) {
      this.headerCropper.cropit('rotateCCW');
      this.headerChanged = true;
    }
  }

  headerRightClick() {
    if (this.headerCropper.cropit('imageSrc')) {
      this.headerCropper.cropit('rotateCW');
      this.headerChanged = true;
    }
  }

  saveHeader() {
    this.headerURI = this.headerCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 0.75,
      originalSize: false,
    });
    const headerData = JSON.stringify(
      { header: this.headerURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });
    return $.ajax({
      type: 'POST',
      url: app.getServerUrl('ob/header/'),
      contentType: 'application/json; charset=utf-8',
      data: headerData,
      dataType: 'json',
    });
  }

  saveAvatar() {
    this.avatarURI = this.avatarCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 0.75,
      originalSize: false,
    });
    const avatarData = JSON.stringify(
      { avatar: this.avatarURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });
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

    ['primaryColor', 'secondaryColor', 'textColor'].forEach((colorField) => {
      if (!formData[colorField].startsWith('#')) {
        formData[colorField] = `#${formData[colorField]}`;
      }
    });

    return formData;
  }

  save() {
    const formData = this.getFormData();

    this.profile.set(formData);

    const save = this.profile.save();
    let saveAvatar;
    let saveHeader;

    this.trigger('saving');

    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

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
          this.profile.set('avatarHash', avatarData.hash);
          app.profile.set('avatarHash', avatarData.hash);
        });
      }

      if (this.headerChanged && this.headerCropper.cropit('imageSrc')) {
        saveHeader = this.saveHeader();
        saveHeader.done((headerData) => {
          // set hash in profile to mirror the server copy
          this.profile.set('headerHash', headerData.hash);
          app.profile.set('headerHash', headerData.hash);
        });
      }

      $.whenAll(save, saveAvatar, saveHeader)
        .done(() => {
          this.trigger('saveComplete');
        })
        .fail((...args) => {
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
        });
    }

    this.render();
  }

  render() {
    loadTemplate('modals/settings/page.html', (t) => {
      this.$el.html(t({
        errors: this.profile.validationError || {},
        ...this.profile.toJSON(),
        avatarMinHeight: this.avatarMinHeight,
        avatarMinWidth: this.avatarMinWidth,
        headerMinHeight: this.headerMinHeight,
        headerMinWidth: this.headerMinWidth,
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');
      const avatarPrev = this.$('.js-avatarPreview');
      const avatarInpt = this.$('#avatarInput');
      this.avatarCropper = this.$('#avatarCropper');

      const headerPrev = this.$('.js-headerPreview');
      const headerInpt = this.$('#headerInput');
      this.headerCropper = this.$('#headerCropper');

      this.avatarLoadedOnRender = false;
      this.headerLoadedOnRender = false;

      setTimeout(() => {
        this.avatarCropper.cropit({
          $preview: avatarPrev,
          $fileInput: avatarInpt,
          exportZoom: 4.7,
          smallImage: 'stretch',
          maxZoom: 2,
          allowDragNDrop: false,
          onImageLoaded: () => {
            const loadedSize = this.avatarCropper.cropit('imageSize');
            this.avatarChanged = this.avatarLoadedOnRender;
            this.avatarLoadedOnRender = true;
            this.$('.js-avatarLeft').removeClass('disabled');
            this.$('.js-avatarRight').removeClass('disabled');
            this.$('.js-avatarZoom').removeClass('disabled');
            this.avatarOffsetOnLoad = this.avatarCropper.cropit('offset');
            this.avatarZoomOnLoad = this.avatarCropper.cropit('zoom');

            if (loadedSize.width < this.avatarMinWidth ||
              loadedSize.height < this.avatarMinHeight) {
              new SimpleMessage({
                title: app.polyglot.t('settings.uploadAvatarSizeError.title'),
                message: app.polyglot.t('settings.uploadAvatarSizeError.body',
                  { minWidth: this.avatarMinWidth, minHeight: this.avatarMinHeight }),
              })
                .render()
                .open();
            }
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
          exportZoom: 10.34,
          smallImage: 'stretch',
          maxZoom: 2,
          allowDragNDrop: false,
          onImageLoaded: () => {
            const loadedSize = this.headerCropper.cropit('imageSize');
            this.headerChanged = this.headerLoadedOnRender;
            this.headerLoadedOnRender = true;
            this.$('.js-headerLeft').removeClass('disabled');
            this.$('.js-headerRight').removeClass('disabled');
            this.$('.js-headerZoom').removeClass('disabled');
            this.headerOffsetOnLoad = this.headerCropper.cropit('offset');
            this.headerZoomOnLoad = this.headerCropper.cropit('zoom');

            if (loadedSize.width < this.headerMinWidth ||
              loadedSize.height < this.headerMinHeight) {
              new SimpleMessage({
                title: app.polyglot.t('settings.uploadHeaderSizeError.title'),
                message: app.polyglot.t('settings.uploadHeaderSizeError.body',
                  { minWidth: this.headerMinWidth, minHeight: this.headerMinHeight }),
              })
                .render()
                .open();
            }
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

        if (this.avatarURI) {
          this.avatarCropper.cropit('imageSrc', this.avatarURI);
        } else if (this.profile.get('avatarHash')) {
          this.avatarCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('avatarHash')}`));
        }

        if (this.headerURI) {
          this.headerCropper.cropit('imageSrc', this.headerURI);
        } else if (this.profile.get('headerHash')) {
          this.headerCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('headerHash')}`));
        }
      }, 0);

      const $firstErr = this.$('.errorList:first');
      if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
    });

    return this;
  }
}

