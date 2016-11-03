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

  imageTooSmall(imageType) {
    const size = this[`${imageType}Cropper`].cropit('imageSize');

    return size.width < this[`${imageType}MinWidth`] || size.height < this[`${imageType}MinHeight`];
  }

  avatarRotate(direction) {
    if (this.avatarCropper.cropit('imageSrc')) {
      // we don't have to check the rotated size of the avatar, because it is square
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
      const loadedSize = this.headerCropper.cropit('imageSize');

      // check to see if rotating the image will make it too small
      if (loadedSize.height < this.headerMinWidth ||
        loadedSize.width < this.headerMinHeight) {
        this.showHeaderSizeWarning(loadedSize, 'settings.loadAvatarSizeError.bodyRotated');
      }

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
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  showAvatarSizeWarning(loadedSize, bodyText = 'settings.loadAvatarSizeError.body') {
    new SimpleMessage({
      title: app.polyglot.t('settings.loadAvatarSizeError.title'),
      message: app.polyglot.t(bodyText,
        { minWidth: this.avatarMinWidth,
          minHeight: this.avatarMinHeight,
          curWidth: loadedSize.width,
          curHeight: loadedSize.height }),
    })
      .render()
      .open();
  }

  showHeaderSizeWarning(loadedSize, bodyText = 'settings.loadHeaderSizeError.body') {
    new SimpleMessage({
      title: app.polyglot.t('settings.loadHeaderSizeError.title'),
      message: app.polyglot.t(bodyText,
        { minWidth: this.headerMinWidth,
          minHeight: this.headerMinHeight,
          curWidth: loadedSize.width,
          curHeight: loadedSize.height }),
    })
      .render()
      .open();
  }

  render() {
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
        avatarMinHeight: this.avatarMinHeight,
        avatarMinWidth: this.avatarMinWidth,
        headerMinHeight: this.headerMinHeight,
        headerMinWidth: this.headerMinWidth,
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');
      const avatarPrev = this.$('.js-avatarPreview');
      const avatarInpt = this.$('#avatarInput');
      this.avatarCropper = this.$('#avatarCropper');
      this.avatarZoomMsg = this.$('.js-avatarZoomWarning');

      const headerPrev = this.$('.js-headerPreview');
      const headerInpt = this.$('#headerInput');
      this.headerCropper = this.$('#headerCropper');
      this.headerZoomMsg = this.$('.js-headerZoomWarning');

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
          onImageLoaded: () => {
            const loadedSize = this.avatarCropper.cropit('imageSize');
            const imgTooSmall = this.imageTooSmall('avatar');
            this.avatarOffsetOnLoad = this.avatarCropper.cropit('offset');
            this.avatarZoomOnLoad = this.avatarCropper.cropit('zoom');
            this.$('.js-avatarLeft').removeClass('disabled');
            this.$('.js-avatarRight').removeClass('disabled');
            this.$('.js-avatarZoom').removeClass('disabled');

            if (!this.avatarLoadedOnRender && imgTooSmall) {
              this.showAvatarSizeWarning(loadedSize);
            }

            this.avatarChanged = !this.avatarLoadedOnRender;
            this.avatarLoadedOnRender = false;
          },
          onZoomEnabled: () => {
            this.avatarZoomMsg.addClass('hide');
          },
          onZoomDisabled: () => {
            // when the zoome is disabled, show the warning
            // the zoom is disabled if no image is loaded, check for that condition
            if (this.avatarCropper.cropit('imageSrc')) {
              this.avatarZoomMsg.removeClass('hide');
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
          smallImage: 'stretch',
          allowDragNDrop: false,
          onImageLoaded: () => {
            const loadedSize = this.headerCropper.cropit('imageSize');
            const imgTooSmall = this.imageTooSmall('header');
            this.headerOffsetOnLoad = this.headerCropper.cropit('offset');
            this.headerZoomOnLoad = this.headerCropper.cropit('zoom');
            this.$('.js-headerLeft').removeClass('disabled');
            this.$('.js-headerRight').removeClass('disabled');
            this.$('.js-headerZoom').removeClass('disabled');

            if (!this.headerLoadedOnRender && imgTooSmall) {
              this.showHeaderSizeWarning(loadedSize);
            }

            this.headerChanged = !this.headerLoadedOnRender;
            this.headerLoadedOnRender = false;
          },
          onZoomEnabled: () => {
            this.headerZoomMsg.addClass('hide');
          },
          onZoomDisabled: () => {
            // when the zoome is disabled, show the warning
            // the zoom is disabled if no image is loaded, check for that condition
            if (this.headerCropper.cropit('imageSrc')) {
              this.headerZoomMsg.removeClass('hide');
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

        if (avatarURI) {
          this.avatarCropper.cropit('imageSrc', avatarURI);
        } else if (this.profile.get('avatarHashes').get('original')) {
          this.avatarCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('avatarHashes').get('original')}`));
        }

        if (headerURI) {
          this.headerCropper.cropit('imageSrc', headerURI);
        } else if (this.profile.get('headerHashes').get('original')) {
          this.headerCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('headerHashes').get('original')}`));
        }

        // after the preview is set, set the max zoom so the cropped size can't be less than the min
        // calculated here in case the preview sizes are changed in the future.
        const avatarPrevInner = avatarPrev.find('.cropit-preview-image-container');
        const maxAWZoom = avatarPrevInner.width() / this.avatarMinWidth;
        const maxAHZoom = avatarPrevInner.height() / this.avatarMinHeight;
        this.avatarCropper.cropit('maxZoom', Math.min(maxAWZoom, maxAHZoom));

        const headerPrevInner = headerPrev.find('.cropit-preview-image-container');
        const maxHWZoom = headerPrevInner.width() / this.headerMinWidth;
        const maxHHZoom = headerPrevInner.height() / this.headerMinHeight;
        this.headerCropper.cropit('maxZoom', Math.min(maxHWZoom, maxHHZoom));
      }, 0);
    });

    return this;
  }
}

