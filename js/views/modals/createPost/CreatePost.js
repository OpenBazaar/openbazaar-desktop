import $ from 'jquery';
import '../../../utils/lib/velocity';
import '../../../lib/select2';
import Sortable from 'sortablejs';
import _ from 'underscore';
import path from 'path';
import '../../../utils/lib/velocityUiPack.js';
import Backbone from 'backbone';
import app from '../../../app';
import { isScrolledIntoView, openExternal } from '../../../utils/dom';
import { installRichEditor } from '../../../utils/lib/trumbowyg';
import SimpleMessage, { openSimpleMessage } from '../SimpleMessage';
import Dialog from '../Dialog';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';


export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    if (options.onClickViewPost !== undefined &&
      typeof options.onClickViewPost !== 'function') {
      throw new Error('If providing an onClickViewPost option, it must be ' +
        'provided as a function.');
    }

    const opts = {
      removeOnClose: true,
      ...options,
    };

    super(opts);
    this.options = opts;

    // So the passed in modal does not get any un-saved data,
    // we'll clone and update it on sync
    this._origModel = this.model;
    this.model = this._origModel.clone();

    this.listenTo(this.model, 'sync', () => {
      setTimeout(() => {
        if (this.createMode && !this.model.isNew()) {
          this.createMode = false;
          // this.$('.js-listingHeading').text(app.polyglot.t('editListing.editListingLabel'));
        }

        const updatedData = this.model.toJSON();

        this._origModel.set(updatedData);
      });

      // A change event won't fire on a parent model if only nested attributes change.
      // The nested models would need to have change events manually bound to them
      // which is cumbersome with a model like this with so many levels of nesting.
      // If you are interested in any change on the model (as opposed to a specific
      // attribute), the simplest thing to do is use the 'saved' event from the
      // event emitter in models/post/index.js.
    });

    this.selectedNavTabIndex = 0;
    this.createMode = !(this.model.lastSyncedAttrs &&
      this.model.lastSyncedAttrs.slug);
    this.photoUploads = [];
    this.images = this.model.get('postBody').get('images');

    loadTemplate('modals/editListing/uploadPhoto.html',
      uploadT => (this.uploadPhotoT = uploadT));

    this.listenTo(this.images, 'add', this.onAddImage);
    this.listenTo(this.images, 'remove', this.onRemoveImage);

    this.$el.on('scroll', () => {
      if (this.el.scrollTop > 57 && !this.$el.hasClass('fixedNav')) {
        this.$el.addClass('fixedNav');
      } else if (this.el.scrollTop <= 57 && this.$el.hasClass('fixedNav')) {
        this.$el.removeClass('fixedNav');
      }
    });
  }

  className() {
    return `${super.className()} createPost tabbedModal modalScrollPage`;
  }

  events() {
    return {
      'click .js-scrollLink': 'onScrollLinkClick',
      'click .js-return': 'onClickReturn',
      'click .js-save': 'onSaveClick',
      'change #inputPhotoUpload': 'onChangePhotoUploadInput',
      'click .js-addPhoto': 'onClickAddPhoto',
      'click .js-removeImage': 'onClickRemoveImage',
      'click .js-cancelPhotoUploads': 'onClickCancelPhotoUploads',
      'click .js-viewListing': 'onClickViewListing',
      'click .js-viewListingOnWeb': 'onClickViewListingOnWeb',
      ...super.events(),
    };
  }

  get MAX_PHOTOS() {
    return this.model.get('postBody').max.images;
  }

  get createMode() {
    return this._createMode;
  }

  set createMode(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide bool as a boolean.');
    }

    if (bool !== this._createMode) {
      this._createMode = bool;
      this.$el.toggleClass('editMode', !this._createMode);
    }
  }

  onClickReturn() {
    this.trigger('click-return', { view: this });
  }

  onClickViewPost() {
    if (this.options.onClickViewPost) {
      this.options.onClickViewPost.call(this);
    } else {
      const slug = this.model.get('slug');
      if (slug) {
        app.router.navigate(`${app.profile.id}/post/${slug}`, { trigger: true });
      } else {
        throw new Error('There is no slug for this post in order to navigate!');
      }
    }
  }

  onClickViewListingOnWeb() {
    const slug = this.model.get('slug');
    if (slug) {
      openExternal(`http://openbazaar.com/store/${app.profile.id}/${slug}`);
    } else {
      throw new Error('There is no slug for this listing in order to navigate!');
    }
  }

  onAddImage(image) {
    const imageHtml = this.uploadPhotoT({
      closeIconClass: 'js-removeImage',
      ...image.toJSON(),
    });

    this.$photoUploadItems.append(imageHtml);
  }

  onRemoveImage(image, images, options) {
    // 1 is added to the index to account for the .addElement
    this.$photoUploadItems.find('li')
      .eq(options.index + 1)
      .remove();
  }

  onClickRemoveImage(e) {
    // since the first li is the .addElement, we need to subtract 1 from the index
    const removeIndex = $(e.target).parents('li').index() - 1;

    this.images.remove(this.images.at(removeIndex));
  }

  onClickCancelPhotoUploads() {
    this.inProgressPhotoUploads.forEach(photoUpload => photoUpload.abort());
  }


  getOrientation(file, callback) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataView = new DataView(e.target.result);  // eslint-disable-line no-undef
      let offset = 2;

      if (dataView.getUint16(0, false) !== 0xFFD8) return callback(-2);

      while (offset < dataView.byteLength) {
        const marker = dataView.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          offset += 2;
          if (dataView.getUint32(offset, false) !== 0x45786966) {
            return callback(-1);
          }
          const little = dataView.getUint16(offset += 6, false) === 0x4949;
          offset += dataView.getUint32(offset + 4, little);
          const tags = dataView.getUint16(offset, little);
          offset += 2;
          for (let i = 0; i < tags; i++) {
            if (dataView.getUint16(offset + (i * 12), little) === 0x0112) {
              return callback(dataView.getUint16(offset + (i * 12) + 8, little));
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += dataView.getUint16(offset, false);
        }
      }

      return callback(-1);
    };

    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  }

  // todo: write a unit test for this
  truncateImageFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Please provide a filename as a string.');
    }

    const truncated = filename;

    if (filename.length > Image.maxFilenameLength) {
      const parsed = path.parse(filename);
      const nameParseLen = Image.maxFilenameLength - parsed.ext.length;

      // acounting for rare edge case of the extension in and of itself
      // exceeding the max length
      return parsed.name.slice(0, nameParseLen < 0 ? 0 : nameParseLen) +
        parsed.ext.slice(0, Image.maxFilenameLength);
    }

    return truncated;
  }

  onChangePhotoUploadInput() {
    let photoFiles = Array.prototype.slice.call(this.$inputPhotoUpload[0].files, 0);

    // prune out any non-image files
    photoFiles = photoFiles.filter(file => file.type.startsWith('image'));

    this.$inputPhotoUpload.val('');

    const currPhotoLength = this.model.get('postBody')
      .get('images')
      .length;

    if (currPhotoLength + photoFiles.length > this.MAX_PHOTOS) {
      photoFiles = photoFiles.slice(0, this.MAX_PHOTOS - currPhotoLength);

      new SimpleMessage({
        title: app.polyglot.t('createPost.errors.tooManyPhotosTitle'),
        message: app.polyglot.t('createPost.errors.tooManyPhotosBody'),
      })
      .render()
      .open();
    }

    if (!photoFiles.length) return;

    this.$photoUploadingLabel.removeClass('hide');

    const toUpload = [];
    let loaded = 0;
    let errored = 0;

    photoFiles.forEach(photoFile => {
      const newImage = document.createElement('img');

      newImage.src = photoFile.path;

      newImage.onload = () => {
        const imgW = newImage.width;
        const imgH = newImage.height;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = imgW;
        canvas.height = imgH;

        this.getOrientation(photoFile, (orientation) => {
          if (orientation > 4) {
            canvas.width = imgH;
            canvas.height = imgW;
          }

          switch (orientation) {
            case 2:
              ctx.translate(imgW, 0);
              ctx.scale(-1, 1); break;
            case 3:
              ctx.translate(imgW, imgH);
              ctx.rotate(Math.PI); break;
            case 4:
              ctx.translate(0, imgH);
              ctx.scale(1, -1); break;
            case 5:
              ctx.rotate(0.5 * Math.PI);
              ctx.scale(1, -1); break;
            case 6:
              ctx.rotate(0.5 * Math.PI);
              ctx.translate(0, -imgH); break;
            case 7:
              ctx.rotate(0.5 * Math.PI);
              ctx.translate(imgW, -imgH);
              ctx.scale(-1, 1); break;
            case 8:
              ctx.rotate(-0.5 * Math.PI);
              ctx.translate(-imgW, 0); break;
            default: // do nothing
          }

          ctx.drawImage(newImage, 0, 0, imgW, imgH);
          toUpload.push({
            filename: this.truncateImageFilename(photoFile.name),
            image: canvas.toDataURL('image/jpeg', 0.9)
              .replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
          });

          loaded += 1;

          if (loaded + errored === photoFiles.length) {
            this.uploadImages(toUpload);
          }
        });
      };

      newImage.onerror = () => {
        errored += 1;

        if (errored === photoFiles.length) {
          this.$photoUploadingLabel.addClass('hide');

          new SimpleMessage({
            title: app.polyglot.t('editListing.errors.unableToLoadImages',
              { smart_count: errored }),
          })
          .render()
          .open();
        } else if (loaded + errored === photoFiles.length) {
          this.uploadImages(toUpload);
        }
      };
    });
  }

  confirmClose() {
    const deferred = $.Deferred();

    this.setModelData();
    const prevData = this.createMode ? this.attrsAtCreate : this.attrsAtLastSave;
    const curData = this.model.toJSON();

    console.log(prevData, curData);

    if (!_.isEqual(prevData, curData)) {
      const messageKey = `body${this.createMode ? 'Create' : 'Edit'}`;
      this.bringToTop();
      this.closeConfirmDialog = this.createChild(Dialog, {
        removeOnClose: false,
        title: app.polyglot.t('createPost.confirmCloseDialog.title'),
        message: app.polyglot.t(`createPost.confirmCloseDialog.${messageKey}`),
        buttons: [{
          text: app.polyglot.t('createPost.confirmCloseDialog.btnYes'),
          fragment: 'yes',
        }, {
          text: app.polyglot.t('createPost.confirmCloseDialog.btnNo'),
          fragment: 'no',
        }],
      })
        .on('click-yes', () => {
          deferred.resolve();
          this.remove();
        })
        .on('click-no', () => {
          deferred.reject();
          this.closeConfirmDialog.close();
        })
        .on('close', () => deferred.reject())
        .render()
        .open();
    } else {
      deferred.resolve();
    }

    return deferred.promise();
  }

  uploadImages(images) {
    let imagesToUpload = images;

    if (!images) {
      throw new Error('Please provide a list of images to upload.');
    }

    if (typeof images === 'string') {
      imagesToUpload = [images];
    }

    const upload = $.ajax({
      url: app.getServerUrl('ob/images'),
      type: 'POST',
      data: JSON.stringify(imagesToUpload),
      dataType: 'json',
      contentType: 'application/json',
    }).always(() => {
      if (this.isRemoved()) return;
      if (!this.inProgressPhotoUploads.length) this.$photoUploadingLabel.addClass('hide');
    }).done(uploadedImages => {
      if (this.isRemoved()) return;

      this.images.add(uploadedImages.map(image => ({
        filename: image.filename,
        original: image.hashes.original,
        large: image.hashes.large,
        medium: image.hashes.medium,
        small: image.hashes.small,
        tiny: image.hashes.tiny,
      })));
    })
    .fail(jqXhr => {
      openSimpleMessage(app.polyglot.t('editListing.errors.uploadImageErrorTitle',
          { smart_count: imagesToUpload.length }),
        jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
    });

    this.photoUploads.push(upload);
  }

  get inProgressPhotoUploads() {
    return this.photoUploads
      .filter(upload => upload.state() === 'pending');
  }

  onClickAddPhoto() {
    this.$inputPhotoUpload.trigger('click');
  }

  scrollTo($el) {
    if (!$el) {
      throw new Error('Please provide a jQuery element to scroll to.');
    }

    // Had this initially in Velocity, but after markup re-factor, it
    // doesn't work consistently, so we'll go old-school for now.
    this.$el
      .animate({
        scrollTop: $el.position().top,
      }, {
        complete: () => {
          setTimeout(
            () => this.$el.on('scroll', this.throttledOnScroll),
            100);
        },
      }, 400);
  }

  onScrollLinkClick(e) {
    const index = $(e.target).index();
    this.selectedNavTabIndex = index;
    this.$scrollLinks.removeClass('active');
    $(e.target).addClass('active');
    this.$el.off('scroll', this.throttledOnScroll);
    this.scrollTo(this.$scrollToSections.eq(index));
  }

  onScroll() {
    let index = 0;
    let keepLooping = true;

    while (keepLooping) {
      if (isScrolledIntoView(this.$scrollToSections[index])) {
        this.$scrollLinks.removeClass('active');
        this.$scrollLinks.eq(index).addClass('active');
        this.selectedNavTabIndex = index;
        keepLooping = false;
      } else {
        if (index === this.$scrollToSections.length - 1) {
          keepLooping = false;
        } else {
          index += 1;
        }
      }
    }
  }

  onSaveClick() {
    this.$saveButton.addClass('disabled');
    this.setModelData();

    const serverData = this.model.toJSON();
    console.log(serverData);

    const save = this.model.save({}, {
      attrs: serverData.postBody,
    });

    if (save) {
      const savingStatusMsg = app.statusBar.pushMessage({
        msg: 'Saving post...',
        type: 'message',
        duration: 99999999999999,
      }).on('clickViewPost', () => {
        const guidUrl = `#${app.profile.id}/posts/${this.model.get('slug')}`;
        const base = app.profile.get('handle') ?
          `@${app.profile.get('handle')}` : app.profile.id;
        const url = `${base}/posts/${this.model.get('slug')}`;

        if (location.hash === guidUrl) {
          Backbone.history.loadUrl();
        } else {
          app.router.navigateUser(url, app.profile.id, { trigger: true });
        }
      });

      save.always(() => this.$saveButton.removeClass('disabled'))
        .fail((...args) => {
          savingStatusMsg.update({
            msg: `Post <em>${this.model.toJSON().postBody.title}</em> failed to save.`,
            type: 'warning',
          });

          setTimeout(() => savingStatusMsg.remove(), 3000);

          new SimpleMessage({
            title: app.polyglot.t('createPost.errors.saveErrorTitle'),
            message: args[0] && args[0].responseJSON && args[0].responseJSON.reason || '',
          })
          .render()
          .open();
        }).done(() => {
          savingStatusMsg.update(`Post ${this.model.toJSON().postBody.title}` +
            ' saved. <a class="js-viewListing">view</a>');
          this.attrsAtLastSave = this.model.toJSON();

          setTimeout(() => savingStatusMsg.remove(), 6000);
        });
    } else {
      // client side validation failed
      this.$saveButton.removeClass('disabled');
    }

    // render so errrors are shown / cleared
    this.render(!!save);

    if (!save) {
      const $firstErr = this.$('.errorList:visible').eq(0);
      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        // There's a model error that's not represented in the UI - likely
        // developer error.
        const msg = Object.keys(this.model.validationError)
          .reduce((str, errKey) =>
            `${str}${errKey}: ${this.model.validationError[errKey].join(', ')}<br>`, '');
        openSimpleMessage(app.polyglot.t('editListing.errors.saveErrorTitle'),
          msg);
      }
    }
  }

  /**
   * Will set the model with data from the form, including setting nested models
   * and collections which are managed by nested views.
   */
  setModelData() {
    const formData = this.getFormData(this.$formFields);
    // const postBody = this.model.get('postBody');

    this.model.set({
      ...formData,
      title: formData.postBody.title,
      postBody: {
        ...formData.postBody,
      },

    });
  }

  open() {
    super.open();

    if (!this.openedBefore) {
      this.openedBefore = true;
    }
    return this;
  }

  get $scrollToSections() {
    return this._$scrollToSections ||
      (this._$scrollToSections = this.$('.js-scrollToSection'));
  }

  get $scrollLinks() {
    return this._$scrollLinks ||
      (this._$scrollLinks = this.$('.js-scrollLink'));
  }

  get $formFields() {
    const isCrypto = this.getCachedEl('#editContractType').val() === 'CRYPTOCURRENCY';
    const cryptoExcludes = isCrypto ? ', .js-inventoryManagementSection' : '';
    const excludes = '.js-sectionShipping, .js-couponsSection, .js-variantsSection, ' +
      `.js-variantInventorySection${cryptoExcludes}`;

    let $fields = this.$(
      `.js-formSectionsContainer > section:not(${excludes}) select[name],` +
      `.js-formSectionsContainer > section:not(${excludes}) input[name],` +
      `.js-formSectionsContainer > section:not(${excludes}) div[contenteditable][name],` +
      `.js-formSectionsContainer > section:not(${excludes}) ` +
        'textarea[name]:not([class*="trumbowyg"])'
    );

    // Filter out hidden fields that are not applicable based on whether this is
    // a crypto currency listing.
    $fields = $fields.filter((index, el) => {
      const $excludeContainers = isCrypto ?
        this.getCachedEl('.js-standardTypeWrap')
          .add(this.getCachedEl('.js-skuMatureContentRow')) :
        this.getCachedEl('.js-cryptoTypeWrap');

      let keep = true;

      $excludeContainers.each((i, container) => {
        if ($.contains(container, el)) {
          keep = false;
        }
      });

      return keep;
    });

    return $fields;
  }

  get $saveButton() {
    return this._$buttonSave ||
      (this._$buttonSave = this.$('.js-save'));
  }

  get $inputPhotoUpload() {
    return this._$inputPhotoUpload ||
      (this._$inputPhotoUpload = this.$('#inputPhotoUpload'));
  }

  get $photoUploadingLabel() {
    return this._$photoUploadingLabel ||
      (this._$photoUploadingLabel = this.$('.js-photoUploadingLabel'));
  }

  remove() {
    this.inProgressPhotoUploads.forEach(upload => upload.abort());
    $(window).off('resize', this.throttledResizeWin);
    super.remove();
  }

  render(restoreScrollPos = true) {
    const prevScrollPos = 0;

    const postBody = this.model.get('postBody');

    loadTemplate('modals/createPost/createPost.html', t => {
      this.$el.html(t({
        createMode: this.createMode,
        selectedNavTabIndex: this.selectedNavTabIndex,
        returnText: this.options.returnText,
        errors: this.model.validationError || {},
        photoUploadInprogress: !!this.inProgressPhotoUploads.length,
        uploadPhotoT: this.uploadPhotoT,
        max: {
          title: postBody.max.titleLength,
          photos: this.MAX_PHOTOS,
        },
        ...this.model.toJSON(),
      }));

      super.render();

      this._$scrollLinks = null;
      this._$scrollToSections = null;
      this._$currencySelect = null;
      this._$priceInput = null;
      this._$buttonSave = null;
      this._$inputPhotoUpload = null;
      this._$photoUploadingLabel = null;
      this._$editListingReturnPolicy = null;
      this._$editListingTermsAndConditions = null;
      this._$sectionShipping = null;
      this._$maxCatsWarning = null;
      this._$maxTagsWarning = null;
      this._$addShipOptSectionHeading = null;
      this._$variantInventorySection = null;
      this._$itemPrice = null;
      this.$photoUploadItems = this.$('.js-photoUploadItems');
      this.$modalContent = this.$('.modalContent');
      this.$tabControls = this.$('.tabControls');
      this.$titleInput = this.$('#editListingTitle');
      this.$editListingTags = this.$('#editListingTags');
      this.$editListingCategories = this.$('#editListingCategories');
      this.$shippingOptionsWrap = this.$('.js-shippingOptionsWrap');
      this.$couponsSection = this.$('.js-couponsSection');
      this.$variantsSection = this.$('.js-variantsSection');

      installRichEditor(this.$('#editListingDescription'), {
        topLevelClass: 'clrBr',
      });

      if (this.sortablePhotos) this.sortablePhotos.destroy();
      this.sortablePhotos = Sortable.create(this.$photoUploadItems[0], {
        filter: '.js-addPhotoWrap',
        onUpdate: (e) => {
          const imageModels = this.model
            .get('postBody')
            .get('images')
            .models;

          const movingModel = imageModels[e.oldIndex - 1];
          imageModels.splice(e.oldIndex - 1, 1);
          imageModels.splice(e.newIndex - 1, 0, movingModel);
        },
        onMove: (e) => ($(e.related).hasClass('js-addPhotoWrap') ? false : undefined),
      });

      setTimeout(() => {
        if (!this.rendered) {
          this.rendered = true;
          this.$titleInput.focus();
        }
      });

      setTimeout(() => {
        // restore the scroll position
        if (restoreScrollPos) {
          this.el.scrollTop = prevScrollPos;
        }

        this.throttledOnScroll = _.bind(_.throttle(this.onScroll, 100), this);
        setTimeout(() => this.$el.on('scroll', this.throttledOnScroll), 100);
      });

      // This block should be after any dom manipulation in render.
      if (this.createMode) {
        if (!this.attrsAtCreate) {
          this.setModelData();
          this.attrsAtCreate = this.model.toJSON();
        }
      } else {
        if (!this.attrsAtLastSave) {
          this.setModelData();
          this.attrsAtLastSave = this.model.toJSON();
        }
      }
    });

    return this;
  }
}

