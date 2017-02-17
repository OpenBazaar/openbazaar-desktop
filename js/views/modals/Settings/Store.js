import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import '../../../lib/select2';
import '../../../lib/whenAll.jquery';
import baseVw from '../../baseVw';
import Moderators from '../../../collections/Moderators';
import ModCard from '../../moderatorCard';
import { openSimpleMessage } from '../SimpleMessage';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsStore',
      ...options,
    });

    this.profile = app.profile.clone();
    this.settings = app.settings.clone();

    this.modsSelected = new Moderators(this.settings.get('storeModerators'), { parse: true });

    this.modsByID = new Moderators(null);

    this.modsAvailable = new Moderators(null, {
      async: true,
    });

    this.listenTo(this.modsSelected, 'update', () => {
      this.buildModList(this.modsSelected, this.$modListSelected);
    });

    this.listenTo(this.modsByID, 'update', () => {
      this.buildModList(this.modsByID, this.$modListByID);
    });

    this.listenTo(this.modsAvailable, 'update', () => {
      this.buildModList(this.modsAvailable, this.$modListAvailable);
    });

    this.fakeModsList = [
      { guid: 'QmSLTwZQPxX1peJVXxBBKTrVGVMKSSyom5sTDHxtVricvs',
        handle: 'TestOneHandle',
        name: 'Test One',
        location: 'Location One, United States of Bolivian Fartknockers',
        moderator: true,
        avatarHashes: {
          tiny: 'QmUoZPVteEJ3HYXYfbVrVpSQFA3Qw5Wpv3xDrMDtvvNDwd',
          small: 'QmPC9Et76jMFC9QKTbgDVn4kz539sjNEFquTNV8VBvbcUP',
          medium: 'QmTxcb8wcFyp3toxcQQHE4rfxDRoqnuc5q7nfCgNbiRjuN',
          large: 'QmenAm6uY1zByEHpWtYtC1Etppi7TYwKwAuobNLHnhMTQS',
          original: 'QmR31hX16umHgnvUWmfmvzi7qtYkCJjjn4H6D3ZJ8J5kid',
        },
        modInfo: {
          description: 'Test One Description of moderation stuff Test One Description of ' +
          'moderation stuff Test One Description of moderation stuff Test One Description of ' +
          'moderation stuff Test One Description of moderation stuff',
          termsAndConditions: 'Test One terms and conditions of things that are conditional',
          languages: [
            'en-US', 'sp',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 2.25,
            },
            percentage: 5.1,
            feeType: 'PERCENTAGE',
          },
        },
      },
      { guid: 'QmbY4yo9Eifg7DPjL7qK5JvNdiJaRAD7N76gVg4YoQsvgA',
        handle: 'TestTwoHandle',
        name: 'Test two',
        location: 'Location Two, Some other place that is somewhere else',
        moderator: true,
        avatarHashes: {
          tiny: 'QmUoZPVteEJ3HYXYfbVrVpSQFA3Qw5Wpv3xDrMDtvvNDwd',
          small: 'QmPC9Et76jMFC9QKTbgDVn4kz539sjNEFquTNV8VBvbcUP',
          medium: 'QmTxcb8wcFyp3toxcQQHE4rfxDRoqnuc5q7nfCgNbiRjuN',
          large: 'QmenAm6uY1zByEHpWtYtC1Etppi7TYwKwAuobNLHnhMTQS',
          original: 'QmR31hX16umHgnvUWmfmvzi7qtYkCJjjn4H6D3ZJ8J5kid',
        },
        modInfo: {
          description: 'Test Two Descriptive description',
          termsAndConditions: 'This is the terms and conditions for test 2',
          languages: [
            'en-US',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 4,
            },
            percentage: 0.25,
            feeType: 'FIXED',
          },
        },
      },
      { guid: 'QmdzzGGc9xZq8w4z42vSHe32DZM7VXfDUFEUyfPvYNYhXE',
        handle: 'THREE YO',
        name: 'Test 3',
        location: 'Location 3',
        moderator: true,
        avatarHashes: {
          tiny: 'QmUoZPVteEJ3HYXYfbVrVpSQFA3Qw5Wpv3xDrMDtvvNDwd',
          small: 'QmPC9Et76jMFC9QKTbgDVn4kz539sjNEFquTNV8VBvbcUP',
          medium: 'QmTxcb8wcFyp3toxcQQHE4rfxDRoqnuc5q7nfCgNbiRjuN',
          large: 'QmenAm6uY1zByEHpWtYtC1Etppi7TYwKwAuobNLHnhMTQS',
          original: 'QmR31hX16umHgnvUWmfmvzi7qtYkCJjjn4H6D3ZJ8J5kid',
        },
        modInfo: {
          description: 'Test 3 Descriptive',
          termsAndConditions: 'This is the terms and conditions for test 3',
          languages: [
            'en-US',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 0.03,
            },
            percentage: 0.25,
            feeType: 'FIXED',
          },
        },
      },
      { guid: 'QmePWxsFT9wY3QuukgVDB7XZpqdKhrqJTHTXU7ECLDWJqX',
        handle: '4 444444 4',
        name: 'Test 4',
        location: 'Location 4',
        moderator: true,
        avatarHashes: {
          tiny: 'QmUoZPVteEJ3HYXYfbVrVpSQFA3Qw5Wpv3xDrMDtvvNDwd',
          small: 'QmPC9Et76jMFC9QKTbgDVn4kz539sjNEFquTNV8VBvbcUP',
          medium: 'QmTxcb8wcFyp3toxcQQHE4rfxDRoqnuc5q7nfCgNbiRjuN',
          large: 'QmenAm6uY1zByEHpWtYtC1Etppi7TYwKwAuobNLHnhMTQS',
          original: 'QmR31hX16umHgnvUWmfmvzi7qtYkCJjjn4H6D3ZJ8J5kid',
        },
        modInfo: {
          description: 'Test 4 Descriptive',
          termsAndConditions: 'This is the terms and conditions for test 4',
          languages: [
            'en-US',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 0.03,
            },
            percentage: 0.25,
            feeType: 'FIXED',
          },
        },
      },
      { guid: 'QmePWxsFT9wY3QuukgVDB7XZpqdKhrqJTHTXU7ECLDWJqX',
        handle: 'Moderator is false',
        name: 'This should not be displayed',
        location: 'Location 4',
        moderator: false,
        modInfo: {
          description: 'Test 4 Descriptive',
          termsAndConditions: 'This is the terms and conditions for test 4',
          languages: [
            'en-US',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 0.03,
            },
            percentage: 0.25,
            feeType: 'FIXED',
          },
        },
      },
      { guid: 'QmePWxsFT9wY3QuukgVDB7XZpqdKhrqJTHTXU7ECLDWJqX',
        handle: 'Moderator is missing',
        name: 'This should not be displayed',
        location: 'Location 4',
        modInfo: {
          description: 'Test 4 Descriptive',
          termsAndConditions: 'This is the terms and conditions for test 4',
          languages: [
            'en-US',
          ],
          fee: {
            fixedFee: {
              currencyCode: 'USD',
              amount: 0.03,
            },
            percentage: 0.25,
            feeType: 'FIXED',
          },
        },
      },
      { guid: 'QmePWxsFT9wY3QuukgVDB7XZpqdKhrqJTHTXU7ECLDWJqX',
        handle: 'ModInfo cannot be found',
        name: 'This should not be displayed',
        location: 'Location 4',
        moderator: true,
      },
    ];

    this.listenTo(this.profile, 'sync', () => app.profile.set(this.profile.toJSON()));
    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toJSON()));
  }

  events() {
    return {
      'click .js-browseMods': 'fetchAvailableModerators',
      'click .js-save': 'save',
    };
  }

  fetchAvailableModerators() {
    // be aware that this call can take a long time
    this.$browseMods.addClass('processing');
    this.modsAvailable.fetch()
      .done(() => {
        // fake code for now
        this.modsAvailable.add(this.fakeModsList);
      })
      .always(() => {
        this.$browseMods.removeClass('processing');
      });
  }

  buildModList(collection, target) {
    // clear any existing content
    target.children().not('.js-noModsAdded').remove();
    target.toggleClass('hasMods', !!collection.length);

    if (collection.length) {
      const docFrag = $(document.createDocumentFragment());
      collection.each((moderator) => {
        const newMod = this.createChild(ModCard, {
          model: moderator,
        });
        docFrag.append(newMod.render().$el);
      });
      target.append(docFrag);
    }
  }

  getProfileFormData(subset = this.$profileFormFields) {
    return super.getFormData(subset);
  }

  getSettingsData() {
    console.log('get settings data');
  }

  save() {
    // this view saves to two different models
    const profileFormData = this.getProfileFormData();
    const settingsFormData = this.getSettingsData();

    this.profile.set(profileFormData);
    this.settings.set(settingsFormData);

    if (!this.profile.validationError && !this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('settings.storeTab.status.saving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      const profileSave = this.profile.save(profileFormData, {
        attrs: profileFormData,
        type: 'PATCH',
      });

      const settingsSave = this.settings.save(settingsFormData, {
        attrs: settingsFormData,
        type: 'PATCH',
      });

      $.when(profileSave, settingsSave)
        .done(() => {
          // both have saved
          statusMessage.update({
            msg: app.polyglot.t('settings.storeTab.status.done'),
            type: 'confirmed',
          });
        })
        .fail((...args) => {
          // if at least one save fails, the save has failed.
          const errMsg = args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';

          openSimpleMessage(app.polyglot.t('settings.storeTab.status.error'), errMsg);

          statusMessage.update({
            msg: app.polyglot.t('settings.storeTab.settings.fail'),
            type: 'warning',
          });
        })
        .always(() => {
          this.$btnSave.removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
    }

    // render so errrors are shown / cleared
    this.render();

    if (!this.profile.validationError && !this.settings.validationError) {
      this.$btnSave.addClass('processing');
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  get $modListSelected() {
    return this._$modListSelected ||
      (this._$modListSelected = this.$('.js-modListSelected'));
  }

  get $modListByID() {
    return this._$modListByID ||
        (this._$modListByID = this.$('.js-modListByID'));
  }

  get $modListAvailable() {
    return this._$modListAvailable ||
        (this._$modListAvailable = this.$('.js-modListAvailable'));
  }

  get $browseMods() {
    return this._$browseMods ||
        (this._$browseMods = this.$('.js-browseMods'));
  }

  render() {
    loadTemplate('modals/settings/store.html', (t) => {
      this.$el.html(t({
        errors: {
          ...(this.profile.validationError || {}),
          ...(this.settings.validationError || {}),
        },
        ...this.profile.toJSON(),
        ...this.settings.toJSON(),
      }));

      // this.$('#moderationCurrency').select2();

      this.$profileFormFields = this.$('js-profileField');
      this._$btnSave = null;
      this._$modListSelected = null;
      this._$modListByID = null;
      this._$modListAvailable = null;
      this._$browseMods = null;
    });

    return this;
  }
}

