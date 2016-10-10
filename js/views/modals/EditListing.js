import $ from 'jquery';
import '../../utils/velocity';
import 'select2';
import _ from 'underscore';
import { MediumEditor } from 'medium-editor';
import { isScrolledIntoView } from '../../utils/dom';
import { getCurrenciesSortedByCode } from '../../data/currencies';
import SimpleMessage from './SimpleMessage';
import loadTemplate from '../../utils/loadTemplate';
import app from '../../app';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      removeOnClose: true,
      modelContentClass: 'modalContent clrP',
      ...options,
    };

    super(opts);
    this.options = opts;

    // So the passed in modal does not get any un-saved data,
    // we'll clone and update it on sync
    this._origModel = this.model;
    this.model = this._origModel.clone();
    this.listenTo(this.model, 'sync', () => {
      if (this.createMode && this.model.lastSyncedAttrs.listing &&
        this.model.lastSyncedAttrs.listing.slug) {
        this.createMode = false;
        this.$('.js-listingHeading').text(app.polyglot.t('editListing.editListingLabel'));
      }

      if (!_.isEqual(this.model.toJSON(), this._origModel.toJSON())) {
        this._origModel.set(this.model.toJSON(), { silent: true });

        // A change events won't fire on a parent model if a nested model change.
        // The nested models would need to have change events manually bound to them
        // which is cumbersome with a model like this with so many levels of nesting.
        // So, for now, we'll manually fire a change event if anything has changed.
        // TODO: Find a reasonable way to manage something like this and
        // put it in the baseModel.
        this._origModel.trigger('change', this._origModel);
      }
    });

    this.innerListing = this.model.get('listing');
    this.selectedNavTabIndex = 0;
    this.createMode = !(this.model.lastSyncedAttrs.listing &&
      this.model.lastSyncedAttrs.listing.slug);
    this.photoUploads = [];
    this.images = this.innerListing.get('item').get('images');

    loadTemplate('modals/editListing/uploadPhoto.html',
      uploadT => (this.uploadPhotoT = uploadT));

    this.listenTo(this.images, 'add', this.onAddImage);
    this.listenTo(this.images, 'remove', this.onRemoveImage);
  }

  className() {
    return `${super.className()} editListing tabbedModal modalTop`;
  }

  events() {
    return {
      'click .js-scrollLink': 'onScrollLinkClick',
      'click .js-save': 'onSaveClick',
      'change #editformat': 'onChangeformat',
      'change #editListingSlug': 'onChangeSlug',
      'change .js-price': 'onChangePrice',
      'change #inputPhotoUpload': 'onChangePhotoUploadInput',
      'click .js-addPhoto': 'onClickAddPhoto',
      'click .js-removeImage': 'onClickRemoveImage',
      'click .js-cancelPhotoUploads': 'onClickCancelPhotoUploads',
      ...super.events(),
    };
  }

  get MAX_PHOTOS() {
    return this.model.get('listing').get('item').maxImages;
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

  onChangePrice(e) {
    let updatedVal = $(e.target).val().trim();
    const valAsNumber = Number(updatedVal);

    if (!isNaN(valAsNumber)) {
      const decimalPlaces = this.$currencySelect.val() === 'BTC' ? 8 : 2;
      updatedVal = valAsNumber.toFixed(decimalPlaces);
    }

    $(e.target).val(updatedVal);
  }

  onChangeSlug(e) {
    const val = $(e.target).val();

    // we'll make the slug all lowercase,
    // replace spaces with dashes and remove
    // url unfreindly chars.
    // todo: this could be made into a slugify utility
    $(e.target).val(
      val.toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        // replace consecutive dashes with one
        .replace(/-{2,}/g, '-')
    );
  }

  onChangeformat(e) {
    if (e.target.value !== 'PHYSICAL_GOOD') {
      this.$conditionWrap.addClass('disabled');
    } else {
      this.$conditionWrap.removeClass('disabled');
    }
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

  onChangePhotoUploadInput() {
    let photoFiles = Array.prototype.slice.call(this.$inputPhotoUpload[0].files, 0);

    // prune out any non-image files
    photoFiles = photoFiles.filter(file => file.type.startsWith('image'));

    this.$inputPhotoUpload.val('');

    const currPhotoLength = this.innerListing.get('item')
      .get('images')
      .length;

    if (currPhotoLength + photoFiles.length > this.MAX_PHOTOS) {
      photoFiles = photoFiles.slice(0, this.MAX_PHOTOS - currPhotoLength);

      new SimpleMessage({
        title: app.polyglot.t('editListing.errors.tooManyPhotosTitle'),
        message: app.polyglot.t('editListing.errors.tooManyPhotosBody'),
      })
      .render()
      .open();
    }

    if (!photoFiles.length) return;

    this.$uploadingLabel.removeClass('hide');

    // Temporarily limiting the size. If we add in support for the server
    // to offer multiple sizes, we could probably remove or greatly loosen
    // the size restriction here.
    const maxH = 944;
    const maxW = 1028;
    const toUpload = [];
    let loaded = 0;
    let errored = 0;

    photoFiles.forEach(photoFile => {
      const newImage = document.createElement('img');
      let orientation = 1;

      this.getOrientation(photoFile, (val) => {
        if (val === -1) throw new Error('The image is undefined.');
        orientation = val;
      });

      newImage.src = photoFile.path;

      newImage.onload = () => {
        let imgW = newImage.width;
        let imgH = newImage.height;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        loaded += 1;

        if (imgW < imgH) {
          // if image width is smaller than height, set width to max
          imgH *= maxW / imgW;
          imgW = maxW;
        } else {
          imgW *= maxH / imgH;
          imgH = maxH;
        }

        canvas.width = imgW;
        canvas.height = imgH;

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
          filename: photoFile.name,
          image: canvas.toDataURL('image/jpeg', 0.85)
            .replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
        });

        if (loaded + errored === photoFiles.length) {
          this.uploadImages(toUpload);
        }
      };

      newImage.onerror = () => {
        errored += 1;

        if (errored === photoFiles.length) {
          this.$uploadingLabel.addClass('hide');

          new SimpleMessage({
            title: app.polyglot.t('editListing.errors.unableToLoadImagesBody',
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
      if (!this.inProgressPhotoUploads.length) this.$uploadingLabel.addClass('hide');
    }).done(uploadedImage => {
      if (this.isRemoved()) return;
      this.images.add(uploadedImage);
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

  onScrollLinkClick(e) {
    const index = $(e.target).index();
    this.selectedNavTabIndex = index;
    this.$scrollLinks.removeClass('active');
    $(e.target).addClass('active');
    this.$scrollContainer.off('scroll', this.throttledOnScrollContainer);

    this.$scrollToSections.eq(index)
      .velocity('scroll', {
        container: this.$scrollContainer,
        complete: () => this.$scrollContainer.on('scroll', this.throttledOnScrollContainer),
      });
  }

  onScrollContainer() {
    let index = 0;
    let keepLooping = true;

    while (keepLooping) {
      if (isScrolledIntoView(this.$scrollToSections[index])) {
        this.$scrollLinks.removeClass('active');
        this.$scrollLinks.eq(index).addClass('active');
        this.selectedNavTabIndex = index;
        keepLooping = false;
      } else {
        index += 1;
      }
    }
  }

  onSaveClick() {
    const formData = this.getFormData(this.$formFields);

    // todo: show status bar
    this.$saveButton.addClass('disabled');
    this.model.set(formData);

    const save = this.model.save();

    if (save) {
      const savingStatusMsg = app.statusBar.pushMessage({
        msg: 'Saving listing...',
        type: 'message',
        duration: 99999999999999,
      });

      save.always(() => this.$saveButton.removeClass('disabled'))
        .fail((...args) => {
          savingStatusMsg.update({
            msg: `Listing <em>${this.model.toJSON().listing.item.title}</em> failed to save.`,
            type: 'warning',
          });

          setTimeout(() => savingStatusMsg.remove(), 3000);

          new SimpleMessage({
            title: app.polyglot.t('editListing.errors.saveErrorTitle'),
            message: args[0] && args[0].responseJSON && args[0].responseJSON.reason || '',
          })
          .render()
          .open();
        }).done(() => {
          const listingUrl = `#listing/${app.profile.id}/${this.model.get('listing').get('slug')}`;
          savingStatusMsg.update(`Listing ${this.model.toJSON().listing.item.title}` +
            ` saved. <a href="${listingUrl}">view</a>`);

          setTimeout(() => savingStatusMsg.remove(), 6000);
        });
    } else {
      // client side validation failed
      this.$saveButton.removeClass('disabled');

      // temporary for debugging purposes
      console.error('client side validation failed');
      console.error(this.model.validationError);
    }

    // render so errrors are shown / cleared
    this.render(() => {
      const $firstErr = this.$('.errorList:first');
      if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
    });
  }

  get $scrollToSections() {
    return this._$scrollToSections || this.$('.js-scrollToSection');
  }

  get $scrollLinks() {
    return this._$scrollLinks || this.$('.js-scrollLink');
  }

  get $formFields() {
    return this._$formFields || this.$('select[name], input[name], textarea[name]');
  }

  get $currencySelect() {
    return this._$currencySelect || this.$('#editListingCurrency');
  }

  get $priceInput() {
    return this._$priceInput || this.$('#editListingPrice');
  }

  get $conditionWrap() {
    return this._$conditionWrap || this.$('.js-conditionWrap');
  }

  get $saveButton() {
    return this._$buttonSave || this.$('.js-save');
  }

  get $inputPhotoUpload() {
    return this._$inputPhotoUpload || this.$('#inputPhotoUpload');
  }

  get $uploadingLabel() {
    return this._$uploadingLabel || this.$('.js-uploadingLabel');
  }

  get $photoUploadItems() {
    return this._$photoUploadItems || this.$('.js-photoUploadItems');
  }

  setScrollContainerHeight() {
    this.$scrollContainer.css('height', '');
    const height = this.$modalContent.outerHeight() -
      this.$tabControls.outerHeight();

    this.$scrollContainer.height(height);
  }

  remove() {
    if (this.descriptionMediumEditor) this.descriptionMediumEditor.destroy();
    this.inProgressPhotoUploads.forEach(upload => upload.abort());
    $(window).off('resize', this.throttledResizeWin);

    super.remove();
  }

  render(onScrollUpdateComplete, restoreScrollPos = true) {
    let prevScrollPos = 0;

    if (restoreScrollPos && this.$scrollContainer && this.$scrollContainer.length) {
      prevScrollPos = this.$scrollContainer[0].scrollTop;
    }

    this.currencies = this.currencies || getCurrenciesSortedByCode();

    // todo: add model validation to include at least one image

    loadTemplate('modals/editListing/editListing.html', t => {
      this.$el.html(t({
        createMode: this.createMode,
        selectedNavTabIndex: this.selectedNavTabIndex,
        localCurrency: app.settings.get('localCurrency'),
        currencies: this.currencies,
        contractTypes: this.innerListing.get('metadata')
          .contractTypes
          .map((contractType) => ({ code: contractType,
            name: app.polyglot.t(`editListing.formats.${contractType}`) })),
        conditionTypes: this.innerListing.get('item')
          .conditionTypes
          .map((conditionType) => ({ code: conditionType,
            name: app.polyglot.t(`editListing.conditionTypes.${conditionType}`) })),
        errors: this.model.validationError || {},
        photoUploadInprogress: !!this.inProgressPhotoUploads.length,
        uploadPhotoT: this.uploadPhotoT,
        ...this.model.toJSON(),
      }));

      super.render();

      this.$scrollContainer = this.$('.js-scrollContainer');

      this.$('#editformat, #editListingVisibility, #editListingCondition').select2({
        minimumResultsForSearch: Infinity,
      });

      this.$('#editListingCurrency').select2();

      setTimeout(() => {
        if (this.descriptionMediumEditor) this.descriptionMediumEditor.destroy();
        this.descriptionMediumEditor = new MediumEditor('#editListingDescription', {
          placeholder: {
            text: '',
          },
          toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'unorderedlist', 'orderedlist'],
          },
        });

        if (!this.rendered) {
          this.rendered = true;
          this.$titleInput.focus();
        }
      });

      this._$scrollLinks = null;
      this._$scrollToSections = null;
      this._$formFields = null;
      this._$currencySelect = null;
      this._$priceInput = null;
      this._$conditionWrap = null;
      this._$buttonSave = null;
      this._$inputPhotoUpload = null;
      this._$uploadingLabel = null;
      this._$photoUploadItems = null;
      this.$modalContent = this.$('.modalContent');
      this.$tabControls = this.$('.tabControls');
      this.$titleInput = this.$('#editListingTitle');

      this.throttledOnScrollContainer = _.bind(_.throttle(this.onScrollContainer, 100), this);
      this.$scrollContainer.on('scroll', this.throttledOnScrollContainer);

      // we'll hide our modal until the height is adjusted, otherwise
      // there's a noticable glitch
      if (!this.jsHeightSet) {
        this.$modalContent.css('opacity', 0);
      }

      setTimeout(() => {
        this.setScrollContainerHeight();

        // restore the scroll position
        if (restoreScrollPos) {
          this.$scrollContainer[0].scrollTop = prevScrollPos;
        }

        if (typeof onScrollUpdateComplete === 'function') {
          onScrollUpdateComplete.call(this);
        }

        window.requestAnimationFrame(() => {
          this.$modalContent.css('opacity', '');
        });
      });

      if (!this.jsHeightSet) {
        this.jsHeightSet = true;

        const onWinResize = () => {
          const prevScroll = this.$scrollContainer[0].scrollTop;
          this.setScrollContainerHeight();
          this.$scrollContainer[0].scrollTop = prevScroll;
        };

        this.throttledResizeWin =
          _.bind(_.throttle(onWinResize, 100), this);
        $(window).on('resize', this.throttledResizeWin);
      }
    });

    return this;
  }
}

