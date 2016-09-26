import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';
import cropit from 'cropit';  // eslint-disable-line no-unused-vars

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
        'click .js-avatarLeft': 'avatarLeftClick',
        'click .js-avatarRight': 'avatarRightClick',
      },
      ...options,
    });

    this.profile = app.profile.clone();
    this.listenTo(this.profile, 'sync', () => app.profile.set(this.profile.toJSON()));
  }

  avatarLeftClick() {
    this.avatarCropper.cropit('rotateCCW');
    this.avatarChanged = true;
  }

  avatarRightClick() {
    this.avatarCropper.cropit('rotateCW');
    this.avatarChanged = true;
  }

  saveAvatar() {
    const imageURI = this.avatarCropper.cropit('export', {
      type: 'image/jpeg',
      quality: 0.75,
      originalSize: false,
    });
    const avatarData = { avatar: imageURI.replace(/^data:image\/(png|jpeg|webp);base64,/, '') };
    $.post(app.getServerUrl('ob/avatar/'), JSON.stringify(avatarData))
      .done(() => {
        console.log('do something on done');
      })
      .fail(() => {
        console.log('avatar upload failed');
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
    if (this.avatarChanged && this.avatarCropper.cropit('imageSrc')) {
      this.saveAvatar();
    }

    const formData = this.getFormData();

    this.profile.set(formData);

    const save = this.profile.save();

    this.trigger('saving');

    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      save.done(() => this.trigger('saveComplete'))
        .fail((...args) =>
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || ''));
    }

    // render so errrors are shown / cleared
    this.render();

    const $firstErr = this.$('.errorList:first');

    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
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

      this.avatarCropper.cropit({
        $preview: avatarPrev,
        $fileInput: avatarInpt,
        exportZoom: 4.7,
        smallImage: 'stretch',
        maxZoom: 2,
        allowDragNDrop: false,
        onImageLoaded: () => {
          this.avatarChanged = true;
        },
        onZoomChange: () => {
          this.avatarChanged = true;
        },
        onOffsetChange: () => {
          this.avatarChanged = true;
        },
        onFileReaderError: (data) => {
          console.log(data);
        },
        onImageError: (errorObject, errorCode, errorMessage) => {
          console.log(errorObject);
          console.log(errorCode);
          console.log(errorMessage);
        },
      });
      this.avatarCropper.cropit('imageSrc',
        app.getServerUrl(`/ipns/${this.profile.get('id')}/images/huge/avatar`));
    });

    return this;
  }
}

