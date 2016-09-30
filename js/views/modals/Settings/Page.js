import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';
import '../../../lib/whenAll.jquery';
import cropit from 'cropit';  // eslint-disable-line no-unused-vars

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

    this.profile = app.profile.clone();
    this.listenTo(this.profile, 'sync change', () => {
      app.profile.set(this.profile.toJSON());
    });
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
    const imageURI = this.headerCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 0.75,
      originalSize: false,
    });
    const headerData = { header: imageURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') };
    return $.post(app.getServerUrl('ob/header/'), JSON.stringify(headerData));
  }

  saveAvatar() {
    const imageURI = this.avatarCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 0.75,
      originalSize: false,
    });
    const avatarData = { avatar: imageURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') };
    return $.post(app.getServerUrl('ob/avatar/'), JSON.stringify(avatarData));
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
      this.render();
    } else {
      this.trigger('savingToServer');
    }

    if (this.avatarChanged && this.avatarCropper.cropit('imageSrc')) {
      saveAvatar = this.saveAvatar();
      saveAvatar.done((avatarData) => {
        // set hash in profile to mirror the server copy
        this.profile.set('avatarHash', avatarData.hash);
      });
    }

    if (this.headerChanged && this.headerCropper.cropit('imageSrc')) {
      saveHeader = this.saveHeader();
      saveHeader.done((headerData) => {
        // set hash in profile to mirror the server copy
        this.profile.set('headerHash', headerData.hash);
      });
    }

    $.whenAll(save, saveAvatar, saveHeader)
      .done(() => {
        this.trigger('saveComplete');
        this.render();
      })
      .fail((...args) => {
        this.trigger('saveComplete', false, true,
          args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
      });
  }

  render() {
    loadTemplate('modals/settings/page.html', (t) => {
      this.$el.html(t({
        errors: this.profile.validationError || {},
        ...this.profile.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');
      const avatarPrev = this.$('.js-avatarPreview');
      const avatarInpt = this.$('#avatarInput');
      this.avatarCropper = this.$('#avatarCropper');

      const headerPrev = this.$('.js-headerPreview');
      const headerInpt = this.$('#headerInput');
      this.headerCropper = this.$('#headerCropper');

      setTimeout(() => {
        this.avatarCropper.cropit({
          $preview: avatarPrev,
          $fileInput: avatarInpt,
          exportZoom: 4.7,
          smallImage: 'stretch',
          maxZoom: 2,
          allowDragNDrop: false,
          onImageLoaded: () => {
            this.avatarChanged = this.avatarLoadedOnRender;
            this.avatarLoadedOnRender = true;
            this.$('.js-avatarLeft').removeClass('disabled');
            this.$('.js-avatarRight').removeClass('disabled');
          },
          onZoomChange: () => {
            this.avatarChanged = this.avatarZoomedOnRender;
            this.avatarZoomedOnRender = true;
          },
          onOffsetChange: () => {
            this.avatarChanged = this.avatarOffsetOnRender;
            this.avatarOffsetOnRender = true;
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
          exportZoom: 4.7,
          smallImage: 'stretch',
          maxZoom: 2,
          allowDragNDrop: false,
          onImageLoaded: () => {
            this.headerChanged = this.headerLoadedOnRender;
            this.headerLoadedOnRender = true;
            this.$('.js-headerLeft').removeClass('disabled');
            this.$('.js-headerRight').removeClass('disabled');
          },
          onZoomChange: () => {
            this.headerChanged = this.headerZoomedOnRender;
            this.headerZoomedOnRender = true;
          },
          onOffsetChange: () => {
            this.headerChanged = this.headerOffsetOnRender;
            this.headerOffsetOnRender = true;
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

        if (this.profile.get('avatarHash')) {
          // if an image is loaded, set the cropit flags to false
          this.avatarLoadedOnRender = false;
          this.avatarZoomedOnRender = false;
          this.avatarOffsetOnRender = false;
          this.avatarCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('avatarHash')}`));
        } else {
          // if no existing avatar was loaded, set cropit flags to true
          this.avatarLoadedOnRender = true;
          this.avatarZoomedOnRender = true;
          this.avatarOffsetOnRender = true;
        }

        if (this.profile.get('headerHash')) {
          this.headerLoadedOnRender = false;
          this.headerZoomedOnRender = false;
          this.headerOffsetOnRender = false;
          this.headerCropper.cropit('imageSrc',
            app.getServerUrl(`ipfs/${this.profile.get('headerHash')}`));
        } else {
          this.headerLoadedOnRender = true;
          this.headerZoomedOnRender = true;
          this.headerOffsetOnRender = true;
        }
      }, 0);

      const $firstErr = this.$('.errorList:first');
      if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
    });

    return this;
  }
}

