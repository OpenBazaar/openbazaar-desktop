import $ from 'jquery';
import Backbone from 'backbone';
import Polyglot from 'node-polyglot';
import './lib/whenAll.jquery';
import app from './app';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import Dialog from './views/modals/Dialog';
import { getLangByCode } from './data/languages';
import Profile from './models/Profile';
import Settings from './models/Settings';

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

// initialize language functionality
function getValidLanguage(lang) {
  if (getLangByCode(lang)) {
    return lang;
  }

  return 'en-US';
}

const initialLang = getValidLanguage(app.localSettings.get('language'));
app.localSettings.set('language', initialLang);
app.polyglot = new Polyglot();
app.polyglot.extend(require(`./languages/${initialLang}.json`));

app.localSettings.on('change:language', (localSettings, lang) => {
  app.polyglot.extend(
    require(`./languages/${lang}.json`));  // eslint-disable-line global-require

  const restartLangChangeDialog = new Dialog({
    title: app.polyglot.t('langChangeRestartTitle'),
    message: app.polyglot.t('langChangeRestartMessage'),
    buttons: [{
      text: app.polyglot.t('restartNow'),
      fragment: 'restartNow',
    }, {
      text: app.polyglot.t('restartLater'),
      fragment: 'restartLater',
    }],
  }).on('click-restartNow', () => location.reload())
  .on('click-restartLater', () => restartLangChangeDialog.close())
  .render()
  .open();
});

app.pageNav = new PageNav();
$('#pageNavContainer').append(app.pageNav.render().el);

app.router = new ObRouter();

// create and launch loading modal
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
  removeOnRoute: false,
}).render().open();

const fetchConfigDeferred = $.Deferred();

function fetchConfig() {
  $.get(app.getServerUrl('ob/config')).done((...args) => {
    fetchConfigDeferred.resolve(...args);
  }).fail(() => {
    const retryConfigDialog = new Dialog({
      title: 'Unable to get your server config.',
      buttons: [{
        text: 'Retry',
        fragment: 'retry',
      }],
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
    }).on('click-retry', () => {
      retryConfigDialog.close();

      // slight of hand to ensure the loading modal has a chance to at
      // least briefly show before another potential failure
      setTimeout(() => {
        fetchConfig();
      }, 300);
    })
    .render()
    .open();
  });

  return fetchConfigDeferred.promise();
}

const onboardingNeededDeferred = $.Deferred();
let profileFetch;
let settingsFetch;
let onboardProfile = false;
let onboardSettings = false;
let profileFailed;
let settingsFailed;

function isOnboardingNeeded() {
  profileFetch = !profileFetch || profileFailed ?
    app.profile.fetch() : profileFetch;
  settingsFetch = !settingsFetch || settingsFailed ?
    app.settings.fetch() : settingsFetch;

  $.whenAll(profileFetch, settingsFetch)
    .progress((...args) => {
      const state = args[1];

      if (state !== 'success') {
        const jqXhr = args[0];

        if (jqXhr === profileFetch) {
          if (jqXhr.status === 404) {
            onboardProfile = true;
            profileFailed = false;
          } else {
            profileFailed = true;
          }
        } else if (jqXhr === settingsFetch) {
          if (jqXhr.responseJSON && jqXhr.responseJSON.reason === 'sql: no rows in result set') {
            onboardSettings = true;
            settingsFailed = false;
          } else {
            settingsFailed = true;
          }
        }
      }
    })
    .done(() => {
      onboardingNeededDeferred.resolve(false);
    })
    .fail((jqXhr) => {
      if (profileFailed || settingsFailed) {
        const retryOnboardingModelsDialog = new Dialog({
          title: 'Unable to get your profile and settings data.',
          message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
          buttons: [{
            text: 'Retry',
            fragment: 'retry',
          }],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryOnboardingModelsDialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => {
            isOnboardingNeeded();
          }, 300);
        })
        .render()
        .open();
      } else if (onboardProfile || onboardSettings) {
        onboardingNeededDeferred.resolve(true);
      }
    });

  return onboardingNeededDeferred.promise();
}

const onboardDeferred = $.Deferred();
let profileSaveUsePut = false;

function onboard() {
  // for now we'll just manually save the profile and settings
  // model with their defaults.
  let profileSave;
  let settingsSave;

  if (!Object.keys(app.profile.lastSyncedAttrs).length) {
    profileSave = app.profile.save({}, {
      type: profileSaveUsePut ? 'PUT' : 'POST',
    });

    if (!profileSave) {
      throw new Error('Client side validation failed on your new Profile model.' +
        'Ensure your defaults are valid.');
    }
  }

  if (!Object.keys(app.settings.lastSyncedAttrs).length) {
    settingsSave = app.settings.save({}, {
      type: 'POST',
    });

    if (!settingsSave) {
      throw new Error('Client side validation failed on your new Settings model.' +
        'Ensure your defaults are valid.');
    }
  }

  $.when(profileSave, settingsSave).done(() => {
    onboardDeferred.resolve(true);
  }).fail((jqXhr) => {
    if (jqXhr === profileSave && jqXhr.responseJSON &&
      jqXhr.responseJSON.reason === 'Profile already exists. Use PUT.') {
      // todo: when this server bug is fixed, we shouldn't have to do this
      // extra request to use PUT.
      // https://github.com/OpenBazaar/openbazaar-go/issues/53
      profileSaveUsePut = true;
    }

    const retryOnboardingSaveDialog = new Dialog({
      title: `Unable to save your ${jqXhr === profileSave ? 'profile' : 'settings'} data.`,
      message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
      buttons: [{
        text: 'Retry',
        fragment: 'retry',
      }],
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
    }).on('click-retry', () => {
      retryOnboardingSaveDialog.close();

      // slight of hand to ensure the loading modal has a chance to at
      // least briefly show before another potential failure
      setTimeout(() => {
        onboard();
      }, 300);
    })
    .render()
    .open();
  });

  return onboardDeferred.promise();
}

const onboardIfNeededDeferred = $.Deferred();

function onboardIfNeeded() {
  isOnboardingNeeded().done((onboardingNeeded) => {
    if (onboardingNeeded) {
      // let's go onboard
      onboard().done(() => onboardIfNeededDeferred.resolve());
    } else {
      onboardIfNeededDeferred.resolve();
    }
  });

  return onboardIfNeededDeferred.promise();
}

// let's start our flow
fetchConfig().done((data) => {
  app.profile = new Profile({ id: data.guid });

  app.settings = new Settings();
  // We'll default our server languaged to whatever is stored locally.
  app.settings.set('language', app.localSettings.get('language'));

  // Beyond the start-up flow in this file, any language changes should ideally
  // be done via a save on a clone of the app.settings model. When the save succeeds,
  // update the app.settings model which will in turn update our local
  // settings model. You shouldn't be directly updating the language in our local
  // settings model.
  app.settings.on('change:language', (settingsMd, lang) => {
    app.localSettings.save('language', getValidLanguage(lang));
  });

  onboardIfNeeded().done(() => {
    app.pageNav.navigable = true;
    app.loadingModal.close();
    location.hash = location.hash || app.profile.id;
    Backbone.history.start();
  });
});
