import { screen, remote, ipcRenderer } from 'electron';
// import { ipcRenderer, screen, remote } from 'electron';
import $ from 'jquery';
import Backbone from 'backbone';
import Polyglot from 'node-polyglot';
import './lib/whenAll.jquery';
import app from './app';
// import Socket from './utils/Socket';
import ServerConfigs from './collections/ServerConfigs';
import ServerConfig from './models/ServerConfig';
import { connect as serverConnect } from './utils/serverConnect';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import Dialog from './views/modals/Dialog';
import StatusBar from './views/StatusBar';
import { getLangByCode } from './data/languages';
import Profile from './models/Profile';
import Settings from './models/Settings';
import Followers from './collections/Followers';
import listingDeleteHandler from './startup/listingDelete';
import { fetchExchangeRates } from './utils/currency';
import './utils/exchangeRateSyncer';
import './utils/listingData';
import { getBody } from './utils/selectors';

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

const platform = process.platform;

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

// create our status bar view
app.statusBar = new StatusBar();
$('#statusBar').html(app.statusBar.render().el);

// create and launch loading modal
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
  removeOnRoute: false,
}).render().open();

// fix zoom issue on Linux hiDPI
if (platform === 'linux') {
  let scaleFactor = screen.getPrimaryDisplay().scaleFactor;
  if (scaleFactor === 0) {
    scaleFactor = 1;
  }
  getBody().css('zoom', 1 / scaleFactor);
}

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

const fetchStartupDataDeferred = $.Deferred();
let ownFollowingFetch;
let exchangeRatesFetch;
let ownFollowingFailed;

function fetchStartupData() {
  ownFollowingFetch = !ownFollowingFetch || ownFollowingFetch ?
    app.ownFollowing.fetch() : ownFollowingFetch;
  exchangeRatesFetch = exchangeRatesFetch || fetchExchangeRates();

  $.whenAll(ownFollowingFetch, exchangeRatesFetch)
    .progress((...args) => {
      const state = args[1];

      if (state !== 'success') {
        const jqXhr = args[0];

        if (jqXhr === ownFollowingFetch) {
          ownFollowingFailed = true;
        }
      }
    })
    .done(() => {
      fetchStartupDataDeferred.resolve();
    })
    .fail((jqXhr) => {
      if (ownFollowingFailed) {
        const retryFetchStarupDataDialog = new Dialog({
          title: 'Unable to get data about who you\'re following.',
          message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
          buttons: [{
            text: 'Retry',
            fragment: 'retry',
          }],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryFetchStarupDataDialog.close();
          fetchStartupData();
        })
          .render()
          .open();
      } else {
        // We don't care if the exchange rate fetch failed, because
        // the exchangeRateSyncer will display a status message about it
        // and the app will gracefully handle not having exchange rates.
        fetchStartupDataDeferred.resolve();
      }
    });

  return fetchStartupDataDeferred.promise();
}

const onboardIfNeededDeferred = $.Deferred();

function onboardIfNeeded() {
  isOnboardingNeeded().done((onboardingNeeded) => {
    if (onboardingNeeded) {
      // let's go onboard
      onboard().done(() => onboardIfNeededDeferred.resolve());
    } else {
      fetchStartupData().done(() => onboardIfNeededDeferred.resolve());
    }
  });

  return onboardIfNeededDeferred.promise();
}

 // let's start our flow - do we need onboarding?,
 // fetching app wide models...
function start() {
  fetchConfig().done((data) => {
    app.profile = new Profile({ id: data.guid });

    app.settings = new Settings();
    // We'll default our server language to whatever is stored locally.
    app.settings.set('language', app.localSettings.get('language'));

    // Beyond the start-up flow in this file, any language changes should ideally
    // be done via a save on a clone of the app.settings model. When the save succeeds,
    // update the app.settings model which will in turn update our local
    // settings model. You shouldn't be directly updating the language in our local
    // settings model.
    app.settings.on('change:language', (settingsMd, lang) => {
      app.localSettings.save('language', getValidLanguage(lang));
    });

    app.ownFollowing = new Followers(null, { type: 'following' });
    app.ownFollowers = new Followers(null, { type: 'followers' });

    onboardIfNeeded().done(() => {
      fetchStartupData().done(() => {
        app.pageNav.navigable = true;
        app.pageNav.setAppProfile();
        app.loadingModal.close();
        location.hash = location.hash || app.profile.id;
        Backbone.history.start();
      });
    });
  });
}

function connectToServer() {
  const server = app.serverConfigs.activeServer;

  console.log(`Will attempt to connect to server "${server.get('name')}".` +
    ` at ${server.get('serverIp')}.`);
  serverConnect(app.serverConfigs.activeServer)
    .progress(e => {
      console.log(`Status is "${e.status}" for connect attempt` +
        ` ${e.connectAttempt} of ${e.totalConnectAttempts}.`);
    }).done((e) => {
      console.log(`Connected to "${e.server.get('name')}"`);
      start();
    }).fail((e) => {
      console.log(`Failed to connect to "${e.server.get('name')}" for reason: ${e.status}.`);
    });
}

const sendMainActiveServer = (activeServer) => {
  ipcRenderer.send('active-server-set', {
    ...activeServer.toJSON(),
    httpUrl: activeServer.httpUrl,
    socketUrl: activeServer.socketUrl,
    authenticate: activeServer.needsAuthentication(),
  });
};

app.serverConfigs = new ServerConfigs();
app.serverConfigs.on('activeServerChange', (activeServer) =>
  sendMainActiveServer(activeServer));

// get the saved server configurations
app.serverConfigs.fetch().done(() => {
  if (!app.serverConfigs.length) {
    // no saved server configurations
    if (remote.getGlobal('isBundledApp')()) {
      // for a bundled app, we'll create a
      // "default" one and try to connect
      const defaultConfig = new ServerConfig({
        name: 'Default (translate)',
        default: true,
      });

      const save = defaultConfig.save();

      if (save) {
        save.done(() => {
          app.serverConfigs.add(defaultConfig);
          app.serverConfigs.activeServer = defaultConfig;
          connectToServer();
        });
      } else {
        const validationErr = defaultConfig.validationError;

        throw new Error('There were one or more errors saving the default server configuration' +
          `${Object.keys(validationErr).map(key => `\n- ${validationErr[key]}`)}`);
      }
    } else {
      // show connection modal with a state that
      // at least one connection must be created
    }
  } else {
    const activeServer = app.serverConfigs.activeServer;

    if (activeServer) {
      sendMainActiveServer(activeServer);
    } else {
      app.serverConfigs.activeServer = app.serverConfigs.at(0);
    }

    connectToServer();
  }
});

// console.log('serverConfigs');
window.serverConfigs = app.serverConfigs;

// connect to the API websocket
// todo: this will be incorporated in the server
// connection flow
// let socketOpened = false;
// let lostSocketConnectionDialog;

// app.apiSocket = new Socket(app.getSocketUrl());
// app.apiSocket.on('open', () => {
//   if (!socketOpened) {
//     socketOpened = true;
//     if (lostSocketConnectionDialog) lostSocketConnectionDialog.remove();
//     lostSocketConnectionDialog = null;
//     start();
//   } else {
//     location.reload();
//   }
// });

// app.apiSocket.on('close', () => {
//   if (lostSocketConnectionDialog) return;

//   lostSocketConnectionDialog = new Dialog({
//     title: 'Socket connection failure',
//     message: 'We are unable to connect to the API websocket.',
//     buttons: [{
//       text: 'Retry',
//       fragment: 'retry',
//     }],
//     dismissOnOverlayClick: false,
//     dismissOnEscPress: false,
//     showCloseButton: false,
//   }).on('click-retry', () => {
//     lostSocketConnectionDialog.$('.js-retry').addClass('processing');
//     app.apiSocket.connect();

//     // timeout is slight of hand to make it look like its doing something
//     // in the case of instant failures
//     setTimeout(() => {
//       if (lostSocketConnectionDialog) {
//         lostSocketConnectionDialog.$('.js-retry').removeClass('processing');
//       }
//     }, 300);
//   })
//   .render()
//   .open();
// });

// manage publishing sockets
// todo: break the publishing socket startup functionality
// into its own micro-module in js/startup/
// let publishingStatusMsg;
// let publishingStatusMsgRemoveTimer;
// let unpublishedContent = false;

// function setPublishingStatus(msg) {
//   if (!msg && typeof msg !== 'object') {
//     throw new Error('Please provide a msg as an object.');
//   }

//   msg.duration = 99999999999999;

//   if (!publishingStatusMsg) {
//     publishingStatusMsg = app.statusBar.pushMessage({
//       ...msg,
//     });
//     publishingStatusMsg.on('clickRetry', () => {
//       alert('Coming soon - need publish API');
//     });
//   } else {
//     clearTimeout(publishingStatusMsgRemoveTimer);
//     publishingStatusMsg.update(msg);
//   }

//   return publishingStatusMsg;
// }

// app.apiSocket.on('message', (e) => {
//   if (e.jsonData) {
//     if (e.jsonData.status === 'publishing') {
//       setPublishingStatus({
//         msg: 'Publishing...',
//         type: 'message',
//       });

//       unpublishedContent = true;
//     } else if (e.jsonData.status === 'error publishing') {
//       setPublishingStatus({
//         msg: 'Publishing failed. <a class="js-retry">Retry</a>',
//         type: 'warning',
//       });

//       unpublishedContent = true;
//     } else if (e.jsonData.status === 'publish complete') {
//       setPublishingStatus({
//         msg: 'Publishing complete.',
//         type: 'message',
//       });

//       unpublishedContent = false;

//       publishingStatusMsgRemoveTimer = setTimeout(() => {
//         publishingStatusMsg.remove();
//         publishingStatusMsg = null;
//       }, 3000);
//     }
//   }
// });

// let unpublishedConfirm;

// ipcRenderer.on('close-attempt', (e) => {
//   if (!unpublishedContent) {
//     e.sender.send('close-confirmed');
//   } else {
//     if (unpublishedConfirm) return;

//     unpublishedConfirm = new Dialog({
//       title: app.polyglot.t('unpublishedConfirmTitle'),
//       message: app.polyglot.t('unpublishedConfirmBody'),
//       buttons: [{
//         text: app.polyglot.t('unpublishedConfirmYes'),
//         fragment: 'yes',
//       }, {
//         text: app.polyglot.t('unpublishedConfirmNo'),
//         fragment: 'no',
//       }],
//       dismissOnOverlayClick: false,
//       dismissOnEscPress: false,
//       showCloseButton: false,
//     }).on('click-yes', () => e.sender.send('close-confirmed'))
//     .on('click-no', () => {
//       unpublishedConfirm.close();
//       unpublishedConfirm = null;
//     })
//     .render()
//     .open();
//   }
// });

// update ownFollowers based on follow socket communication
// app.apiSocket.on('message', (e) => {
//   if (e.jsonData) {
//     if (e.jsonData.notification) {
//       if (e.jsonData.notification.follow) {
//         app.ownFollowers.unshift({ guid: e.jsonData.notification.follow });
//       } else if (e.jsonData.notification.unfollow) {
//         app.ownFollowers.remove(e.jsonData.notification.unfollow); // remove by id
//       }
//     }
//   }
// });

// initialize our listing delete handler
listingDeleteHandler();
