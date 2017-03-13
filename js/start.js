import { remote, ipcRenderer } from 'electron';
import $ from 'jquery';
import Backbone from 'backbone';
import Polyglot from 'node-polyglot';
import './lib/whenAll.jquery';
import moment from 'moment';
import app from './app';
import ServerConfigs from './collections/ServerConfigs';
import ServerConfig from './models/ServerConfig';
import serverConnect, { events as serverConnectEvents } from './utils/serverConnect';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import { getChatContainer, getBody } from './utils/selectors';
import Chat from './views/chat/Chat.js';
import ChatHeads from './collections/ChatHeads';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import StartupLoadingModal from './views/modals/StartupLoading';
import Dialog from './views/modals/Dialog';
import StatusBar from './views/StatusBar';
import { getLangByCode } from './data/languages';
import Profile from './models/profile/Profile';
import Settings from './models/Settings';
import Followers from './collections/Followers';
import { fetchExchangeRates } from './utils/currency';
import './utils/exchangeRateSyncer';
import './utils/listingData';
import { launchDebugLogModal } from './utils/modalManager';
import listingDeleteHandler from './startup/listingDelete';
import { fixLinuxZoomIssue, handleLinks } from './startup';
import ConnectionManagement from './views/modals/connectionManagement/ConnectionManagement';

fixLinuxZoomIssue();

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
moment.locale(initialLang);
app.polyglot = new Polyglot();
app.polyglot.extend(require(`./languages/${initialLang}.json`));

app.localSettings.on('change:language', (localSettings, lang) => {
  app.polyglot.extend(
    require(`./languages/${lang}.json`));  // eslint-disable-line global-require

  moment.locale(lang);

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

// Instantiating our Server Configs collection now since the page nav
// utilizes it. We'll fetch it later on.
app.serverConfigs = new ServerConfigs();

app.pageNav = new PageNav({
  serverConfigs: app.serverConfigs,
});
$('#pageNavContainer').append(app.pageNav.render().el);

app.router = new ObRouter();

// create our status bar view
app.statusBar = new StatusBar();
$('#statusBar').html(app.statusBar.render().el);

// Create and launch a startup loading modal which will be
// used during the startup connecting process.
const startupLoadingModal = new StartupLoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
}).render().open();

// Create loading modal, which is a shared instance used by
// the app after the initial connect sequence
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
  removeOnRoute: false,
}).render();

handleLinks();

const fetchConfigDeferred = $.Deferred();

function fetchConfig() {
  $.get(app.getServerUrl('ob/config')).done((...args) => {
    fetchConfigDeferred.resolve(...args);
  }).fail(() => {
    const retryConfigDialog = new Dialog({
      title: app.polyglot.t('startUp.dialogs.retryConfig.title'),
      buttons: [
        {
          text: app.polyglot.t('startUp.dialogs.btnRetry'),
          fragment: 'retry',
        },
        {
          text: app.polyglot.t('startUp.dialogs.btnManageConnections'),
          fragment: 'manageConnections',
        },
      ],
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
    }).on('click-manageConnections', () =>
      app.connectionManagmentModal.open())
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
          title: app.polyglot.t('startUp.dialogs.retryOnboardingFetch.title'),
          message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: app.polyglot.t('startUp.dialogs.btnManageConnections'),
              fragment: 'manageConnections',
            },
          ],
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
        }).on('click-manageConnections', () =>
          app.connectionManagmentModal.open())
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
      title: app.polyglot.t('startUp.dialogs.retryOnboardingSave.title', {
        type: jqXhr === profileSave ? 'profile' : 'settings',
      }),
      message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
      buttons: [
        {
          text: app.polyglot.t('startUp.dialogs.btnRetry'),
          fragment: 'retry',
        },
        {
          text: app.polyglot.t('startUp.dialogs.btnManageConnections'),
          fragment: 'manageConnections',
        },
      ],
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
    }).on('click-manageConnections', () =>
          app.connectionManagmentModal.open())
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
          title: app.polyglot.t('startUp.dialogs.unableToGetFollowData.title'),
          message: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: app.polyglot.t('startUp.dialogs.btnManageConnections'),
              fragment: 'manageConnections',
            },
          ],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryFetchStarupDataDialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => fetchStartupData(), 300);
        }).on('click-manageConnections', () =>
          app.connectionManagmentModal.open())
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
 // fetching app-wide models...
function start() {
  fetchConfig().done((data) => {
    app.profile = new Profile({ id: data.guid });

    app.settings = new Settings();
    // If the server is running testnet, set that here
    app.testnet = data.testnet; // placeholder for later when we need this data for purchases

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

        // load chat
        const chatConvos = new ChatHeads();

        chatConvos.once('request', (cl, xhr) => {
          xhr.always(() => app.chat.attach(getChatContainer()));
        });

        app.chat = new Chat({
          collection: chatConvos,
          $scrollContainer: getChatContainer(),
        });

        chatConvos.fetch();
        $('#chatCloseBtn').on('click', () => (app.chat.close()));

        getChatContainer()
            .on('mouseenter', () => getBody().addClass('chatHover'))
            .on('mouseleave', () => getBody().removeClass('chatHover'));
      });
    });
  });
}

function connectToServer() {
  const server = app.serverConfigs.activeServer;
  let connectAttempt = null;

  startupLoadingModal
    .setState({
      msg: app.polyglot.t('startUp.startupLoadingModal.connectAttemptMsg', {
        serverName: server.get('name'),
        canceLink: '<a class="js-cancel delayBorder">' +
          `${app.polyglot.t('startUp.startupLoadingModal.canceLink')}</a>`,
      }),
      // There's a weird issue where the first time we render a message, it renders the
      // underline for the link first and then after a brief delay, the text after it. Looks
      // tacky, so to avoid it, we'll fade in the message.
      msgClass: 'fadeInAnim',
    }).on('clickCancel', () => {
      connectAttempt.cancel();
      app.connectionManagmentModal.open();
      startupLoadingModal.close();
    });

  connectAttempt = serverConnect(app.serverConfigs.activeServer)
    .done(() => {
      startupLoadingModal.close();
      app.loadingModal.open();
      start();
    })
    .fail(() => {
      app.connectionManagmentModal.open();
      startupLoadingModal.close();
      serverConnectEvents.once('connected', () => {
        app.loadingModal.open();
        start();
      });
    });
}

// Handle a server connection event.
let connectedAtLeastOnce = false;

serverConnectEvents.on('connected', () => {
  app.connectionManagmentModal.setModalOptions({
    dismissOnEscPress: true,
    showCloseButton: true,
  });

  if (connectedAtLeastOnce) {
    location.reload();
  } else {
    connectedAtLeastOnce = true;
    app.connectionManagmentModal.close();
    if (app.chat) app.chat.show();
  }
});

// Handle a lost connection.
serverConnectEvents.on('disconnect', () => {
  app.connectionManagmentModal.setModalOptions({
    dismissOnOverlayClick: false,
    dismissOnEscPress: false,
    showCloseButton: false,
  });

  if (app.chat) {
    app.chat.close();
    app.chat.hide();
  }

  app.pageNav.navigable = false;
  app.connectionManagmentModal.open();
});

// If we have a connection, close the Connection Management modal on a
// will-route event.
const onWillRouteCloseConnModal =
  () => app.connectionManagmentModal.close();
serverConnectEvents.on('connected', () =>
  app.router.on('will-route', onWillRouteCloseConnModal));
serverConnectEvents.on('disconnect', () =>
  app.router.off('will-route', onWillRouteCloseConnModal));


const sendMainActiveServer = (activeServer) => {
  ipcRenderer.send('active-server-set', {
    ...activeServer.toJSON(),
    httpUrl: activeServer.httpUrl,
    socketUrl: activeServer.socketUrl,
    authenticate: activeServer.needsAuthentication(),
  });
};

// Alert the main process if we are changing the active server.
app.serverConfigs.on('activeServerChange', (activeServer) =>
  sendMainActiveServer(activeServer));

// Let's create our Connection Management modal so that it's
// available to show when needed.
app.connectionManagmentModal = new ConnectionManagement({
  removeOnRoute: false,
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
}).render();

// get the saved server configurations
app.serverConfigs.fetch().done(() => {
  if (!app.serverConfigs.length) {
    // no saved server configurations
    if (remote.getGlobal('isBundledApp')()) {
      // for a bundled app, we'll create a
      // "default" one and try to connect
      const defaultConfig = new ServerConfig({
        name: app.polyglot.t('connectionManagement.defaultServerName'),
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

        // This is developer error.
        throw new Error('There were one or more errors saving the default server configuration' +
          `${Object.keys(validationErr).map(key => `\n- ${validationErr[key]}`)}`);
      }
    } else {
      app.connectionManagmentModal.open();
      serverConnectEvents.once('connected', () => {
        app.loadingModal.open();
        start();
      });
    }
  } else {
    let activeServer = app.serverConfigs.activeServer;

    if (activeServer) {
      sendMainActiveServer(activeServer);
    } else {
      activeServer = app.serverConfigs.activeServer = app.serverConfigs.at(0);
    }

    if (activeServer.get('default') && !remote.getGlobal('isBundledApp')()) {
      // Your active server is the locally bundled server, but you're
      // not running the bundled app. You have bad data!
      activeServer.set('default', false);
    }

    connectToServer();
  }
});

// Clear localServer events on browser refresh.
$(window).on('beforeunload', () => {
  const localServer = remote.getGlobal('localServer');

  if (localServer) {
    // Since on a refresh any browser variables go away,
    // we need to unbind our handlers from the localServer instance.
    // Otherwise, since that instance lives in the main process
    // and continues to live beyond a refresg, the app would crash
    // when a localServer event is triggered for any of those handlers.
    localServer.off();

    // Let the main process know we've just blown away all the handlers,
    // since some of them may be main process callbacks that the main
    // process may want to revive.
    ipcRenderer.send('renderer-cleared-local-server-events');
  }
});

// Handle 'show debug log' requests from the main process.
ipcRenderer.on('show-server-log', () => launchDebugLogModal());

// manage publishing sockets
// todo: break the publishing socket startup functionality
// into its own micro-module in js/startup/
let publishingStatusMsg;
let publishingStatusMsgRemoveTimer;
let unpublishedContent = false;

function setPublishingStatus(msg) {
  if (!msg && typeof msg !== 'object') {
    throw new Error('Please provide a msg as an object.');
  }

  msg.duration = 99999999999999;

  if (!publishingStatusMsg) {
    publishingStatusMsg = app.statusBar.pushMessage({
      ...msg,
    });
    publishingStatusMsg.on('clickRetry', () => {
      alert('Coming soon - need publish API');
    });
  } else {
    clearTimeout(publishingStatusMsgRemoveTimer);
    publishingStatusMsg.update(msg);
  }

  return publishingStatusMsg;
}

serverConnectEvents.on('connected', (connectedEvent) => {
  connectedEvent.socket.on('message', (e) => {
    if (e.jsonData) {
      if (e.jsonData.status === 'publishing') {
        setPublishingStatus({
          msg: 'Publishing updates to network...',
          type: 'message',
        });

        unpublishedContent = true;
      } else if (e.jsonData.status === 'error publishing') {
        setPublishingStatus({
          msg: 'Publishing failed. <a class="js-retry">Retry</a>',
          type: 'warning',
        });

        unpublishedContent = true;
      } else if (e.jsonData.status === 'publish complete') {
        setPublishingStatus({
          msg: 'Publishing complete.',
          type: 'message',
        });

        unpublishedContent = false;

        publishingStatusMsgRemoveTimer = setTimeout(() => {
          publishingStatusMsg.remove();
          publishingStatusMsg = null;
        }, 3000);
      }
    }
  });
});

let unpublishedConfirm;

ipcRenderer.on('close-attempt', (e) => {
  if (!unpublishedContent) {
    e.sender.send('close-confirmed');
  } else {
    if (unpublishedConfirm) return;

    unpublishedConfirm = new Dialog({
      title: app.polyglot.t('unpublishedConfirmTitle'),
      message: app.polyglot.t('unpublishedConfirmBody'),
      buttons: [{
        text: app.polyglot.t('unpublishedConfirmYes'),
        fragment: 'yes',
      }, {
        text: app.polyglot.t('unpublishedConfirmNo'),
        fragment: 'no',
      }],
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
    }).on('click-yes', () => e.sender.send('close-confirmed'))
    .on('click-no', () => {
      unpublishedConfirm.close();
      unpublishedConfirm = null;
    })
    .render()
    .open();
  }
});

// update ownFollowers based on follow socket communication
serverConnectEvents.on('connected', (connectedEvent) => {
  connectedEvent.socket.on('message', (e) => {
    if (e.jsonData) {
      if (e.jsonData.notification) {
        if (e.jsonData.notification.follow) {
          app.ownFollowers.unshift({ guid: e.jsonData.notification.follow });
        } else if (e.jsonData.notification.unfollow) {
          app.ownFollowers.remove(e.jsonData.notification.unfollow); // remove by id
        }
      }
    }
  });
});

// initialize our listing delete handler
listingDeleteHandler();
