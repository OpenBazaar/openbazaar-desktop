import { remote, ipcRenderer } from 'electron';
import $ from 'jquery';
import Backbone from 'backbone';
import Polyglot from 'node-polyglot';
import './lib/whenAll.jquery';
import moment from 'moment';
import app from './app';
import { getCurrencyByCode } from './data/currencies';
import { getServerCurrency } from './data/cryptoCurrencies';
import ServerConfigs from './collections/ServerConfigs';
import ServerConfig from './models/ServerConfig';
import serverConnect, {
  events as serverConnectEvents,
  getSocket,
  getCurrentConnection,
} from './utils/serverConnect';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import { getChatContainer, getBody } from './utils/selectors';
import { addFeedback } from './utils/feedback';
import { addMetrics, showMetricsModal } from './utils/metrics';
import { showUpdateStatus, updateReady } from './utils/autoUpdate';
import { handleLinks } from './utils/dom';
import Chat from './views/chat/Chat.js';
import ChatHeads from './collections/ChatHeads';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import StartupConnectMessaging from './views/StartupConnectMessaging';
import { openSimpleMessage } from './views/modals/SimpleMessage';
import Dialog from './views/modals/Dialog';
import StatusBar from './views/StatusBar';
import { getTranslationLangByCode, getTrumboLangFileNameByCode } from './data/languages';
import Profile from './models/profile/Profile';
import Settings from './models/settings/Settings';
import WalletBalance from './models/wallet/WalletBalance';
import Followers from './collections/Followers';
import { fetchExchangeRates } from './utils/currency';
import './utils/exchangeRateSyncer';
import { launchDebugLogModal, launchSettingsModal } from './utils/modalManager';
import listingDeleteHandler from './startup/listingDelete';
import { fixLinuxZoomIssue, handleServerShutdownRequests } from './startup';
import ConnectionManagement from './views/modals/connectionManagement/ConnectionManagement';
import Onboarding from './views/modals/onboarding/Onboarding';
import WalletSetup from './views/modals/WalletSetup';
import SearchProvidersCol from './collections/search/SearchProviders';
import defaultSearchProviders from './data/defaultSearchProviders';
import VerifiedMods from './collections/VerifiedMods';
import VerifiedModsError from './views/modals/VerifiedModsFetchError';

fixLinuxZoomIssue();
handleServerShutdownRequests();

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

// initialize language functionality
function getValidLanguage(lang) {
  if (getTranslationLangByCode(lang)) {
    return lang;
  }

  return 'en_US';
}

const initialLang = getValidLanguage(app.localSettings.get('language'));
app.localSettings.set('language', initialLang);
moment.locale(initialLang);
app.polyglot = new Polyglot();
app.polyglot.extend(require(`./languages/${initialLang}.json`));

let trumboLang = getTrumboLangFileNameByCode(initialLang);
if (trumboLang) {
  // eslint-disable-next-line global-require
  app.polyglot.extend(require(`../node_modules/trumbowyg/dist/langs/${trumboLang}.min.js`));
}

app.localSettings.on('change:language', (localSettings, lang) => {

  app.polyglot.extend(
    require(`./languages/${lang}.json`)); // eslint-disable-line global-require

  trumboLang = getTrumboLangFileNameByCode(lang);
  if (trumboLang) {
    app.polyglot.extend( // eslint-disable-next-line global-require
      require(`../node_modules/trumbowyg/dist/langs/${trumboLang}.min.js`));
  }

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

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('contextmenu-click');
}, false);

// Instantiating our Server Configs collection now since the page nav
// utilizes it. We'll fetch it later on.
app.serverConfigs = new ServerConfigs();

app.pageNav = new PageNav({
  serverConfigs: app.serverConfigs,
});
$('#pageNavContainer').append(app.pageNav.render().el);

let externalRoute = remote.getGlobal('externalRoute');

app.router = new ObRouter();

// Clear the external route flag as soon as it's used so it's not re-used
// on app refreshes.
app.router.on('route', () => (externalRoute = null));

// create our status bar view
app.statusBar = new StatusBar();
$('#statusBar').html(app.statusBar.render().el);

const startupConnectMessaging = new StartupConnectMessaging();

// Create loading modal, which is a shared instance used throughout the app
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
  removeOnRoute: false,
}).render().open(startupConnectMessaging);

handleLinks(document);

// add the feedback mechanism
addFeedback();

app.verifiedMods = new VerifiedMods();

const fetchConfigDeferred = $.Deferred();

function fetchConfig() {
  $.get(app.getServerUrl('ob/config')).done((...args) => {
    fetchConfigDeferred.resolve(...args);
  }).fail(xhr => {
    const curConn = getCurrentConnection();

    if (!curConn || curConn.status === 'disconnected') {
      // the connection management modal should be up with relevant info
      console.error('The server config fetch failed. Looks like the connection to the ' +
        'server was lost.');
      return;
    }

    const retryConfigDialog = new Dialog({
      title: app.polyglot.t('startUp.dialogs.retryConfig.title'),
      message: xhr && xhr.responseJSON && xhr.responseJSON.reason ||
        xhr.responseText || '',
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

      // sleight of hand to ensure the loading modal has a chance to at
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

  const fetches = [profileFetch, settingsFetch];

  $.whenAll(fetches.slice())
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
          if (jqXhr.status === 404) {
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
    .fail(() => {
      const jqXhr = fetches.find(
        fetch => fetch.state() === 'rejected');

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

function onboard() {
  const onboarding = new Onboarding()
    .render()
    .open();

  onboarding.on('onboarding-complete', () => {
    location.hash = `${app.profile.id}`;
    onboardDeferred.resolve();
    onboarding.remove();
  });

  return onboardDeferred.promise();
}

let verifiedModsErrorDialog;

function fetchVerifiedMods() {
  return app.verifiedMods.fetch()
    .done(() => {
      if (verifiedModsErrorDialog) verifiedModsErrorDialog.close();
    })
    .fail((jqXhr) => {
      const state = {
        fetching: false,
        reason: jqXhr && jqXhr.responseJSON && jqXhr.responseJSON.reason || jqXhr.status,
      };
      if (verifiedModsErrorDialog) {
        verifiedModsErrorDialog
          .setState(state)
          .open();
      } else {
        verifiedModsErrorDialog = new VerifiedModsError({ initialState: state });
        verifiedModsErrorDialog.on('modal-will-remove', () => {
          verifiedModsErrorDialog = null;
        });
        verifiedModsErrorDialog.on('retry', () => {
          verifiedModsErrorDialog.setState({ fetching: true });
          fetchVerifiedMods();
        });
        verifiedModsErrorDialog.render().open();
      }
    });
}

const fetchStartupDataDeferred = $.Deferred();
let ownFollowingFetch;
let exchangeRatesFetch;
let walletBalanceFetch;
let searchProvidersFetch;

function fetchStartupData() {
  ownFollowingFetch = !ownFollowingFetch || ownFollowingFetch.state() === 'rejected' ?
    app.ownFollowing.fetch() : ownFollowingFetch;
  exchangeRatesFetch = !exchangeRatesFetch || exchangeRatesFetch.state() === 'rejected' ?
    fetchExchangeRates() : exchangeRatesFetch;
  walletBalanceFetch = !walletBalanceFetch || walletBalanceFetch.state() === 'rejected' ?
    app.walletBalance.fetch() : walletBalanceFetch;
  searchProvidersFetch = !searchProvidersFetch || searchProvidersFetch.state() === 'rejected' ?
    app.searchProviders.fetch() : searchProvidersFetch;

  const fetches = [
    ownFollowingFetch,
    exchangeRatesFetch,
    walletBalanceFetch,
    searchProvidersFetch,
  ];

  $.whenAll(fetches.slice())
    .done(() => {
      fetchStartupDataDeferred.resolve();
    })
    .fail(() => {
      const curConn = getCurrentConnection();

      if (!curConn || curConn.status !== 'connected') {
        // the connection management modal should be up with relevant info
        console.error('The startup data fetches failed. Looks like the connection to the ' +
          'server was lost.');
        return;
      }

      // Find any that failed aside from the exchangeRateFetch. We don't care if the
      // exchange rate fetch failed, because the exchangeRateSyncer will display a
      // status message about it and the app will gracefully handle not having exchange
      // rates.
      const failed = fetches.filter(
        xhr => xhr.state() === 'rejected' && xhr !== exchangeRatesFetch);

      if (failed.length) {
        const firstFailedXhr = failed[0];
        let title = '';
        const message = firstFailedXhr.responseJSON && firstFailedXhr.responseJSON.reason ||
          firstFailedXhr.status || '';
        let btnText = app.polyglot.t('startUp.dialogs.btnManageConnections');
        let btnFrag = 'manageConnections';

        if (ownFollowingFetch.state() === 'rejected') {
          title = app.polyglot.t('startUp.dialogs.unableToGetFollowData.title');
        } else if (walletBalanceFetch.state() === 'rejected') {
          title = app.polyglot.t('startUp.dialogs.unableToGetWalletBalance.title');
        } else {
          title = app.polyglot.t('startUp.dialogs.unableToGetSearchProviders.title');
          btnText = app.polyglot.t('startUp.dialogs.unableToGetSearchProviders.btnClose');
          btnFrag = 'continue';
        }

        const retryFetchStartupDataDialog = new Dialog({
          title,
          message,
          buttons: [
            {
              text: app.polyglot.t('startUp.dialogs.btnRetry'),
              fragment: 'retry',
            },
            {
              text: btnText,
              fragment: btnFrag,
            },
          ],
          dismissOnOverlayClick: false,
          dismissOnEscPress: false,
          showCloseButton: false,
        }).on('click-retry', () => {
          retryFetchStartupDataDialog.close();

          // slight of hand to ensure the loading modal has a chance to at
          // least briefly show before another potential failure
          setTimeout(() => fetchStartupData(), 300);
        }).on('click-manageConnections', () =>
          app.connectionManagmentModal.open())
        .on('click-continue', () => {
          retryFetchStartupDataDialog.close();
          fetchStartupDataDeferred.resolve();
        })
        .render()
        .open();
      } else {
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
      onboardIfNeededDeferred.resolve();
    }
  });

  return onboardIfNeededDeferred.promise();
}

function isCryptoCurrencySupported(cryptoCurrency) {
  return !!getCurrencyByCode(cryptoCurrency);
}

let ensureValidSettingsCurDeferred;

function ensureValidSettingsCurrency() {
  if (!ensureValidSettingsCurDeferred) {
    ensureValidSettingsCurDeferred = $.Deferred();
  } else {
    return ensureValidSettingsCurDeferred.promise();
  }

  const settingsCur = app.settings.get('localCurrency');
  const dialogTitle = app.polyglot.t('setValidCurDialog.title');
  const settingsLink =
    '<button class="btnAsLink js-setCurSettings clrTEm">' +
      `${app.polyglot.t('setValidCurDialog.settingsLink')}` +
      '</button>';
  const dialogBody = currency => (
    app.polyglot.t('setValidCurDialog.body', {
      currency,
      settingsLink,
    })
  );

  if (!getCurrencyByCode(settingsCur)) {
    const setValidCurDialog = openSimpleMessage(
      dialogTitle,
      dialogBody(settingsCur), {
        dismissOnEscPress: false,
        showCloseButton: false,
      }
    );

    let settingsModal;

    const bindSetCurSettingsHandler = () => {
      setValidCurDialog.$('.js-setCurSettings')
        .on('click', () =>
          (settingsModal = launchSettingsModal({ initialTab: 'General' })));
    };

    bindSetCurSettingsHandler();

    const onCurChange = (md, cur) => {
      if (getCurrencyByCode(cur)) {
        settingsModal.close();
        setValidCurDialog.close();
        ensureValidSettingsCurDeferred.resolve();
      } else {
        setValidCurDialog.open(dialogTitle, dialogBody(cur));
        bindSetCurSettingsHandler();
        settingsModal.close();
      }
    };

    app.settings.on('change:localCurrency', onCurChange);
  } else {
    ensureValidSettingsCurDeferred.resolve();
  }

  return ensureValidSettingsCurDeferred.promise();
}

// let's start our flow - do we need onboarding?,
// fetching app-wide models...
function start() {
  fetchConfig().done((data) => {
    // This is the server config as returned by ob/config. It has nothing to do with
    // app.serverConfigs which is a collection of server configuration data related
    // to connecting with a server. The latter is stored in local storage.
    app.serverConfig = data || {};

    if (!isCryptoCurrencySupported(app.serverConfig.cryptoCurrency)) {
      const connectLink =
        '<button class="btnAsLink js-connect clrTEm">' +
          `${app.polyglot.t('unsupportedCryptoCurDialog.connectLink')}` +
          '</button>';

      const unsupportedCryptoCurDialog = openSimpleMessage(
        app.polyglot.t('unsupportedCryptoCurDialog.title'),
        app.polyglot.t('unsupportedCryptoCurDialog.body', {
          curCode: app.serverConfig.cryptoCurrency,
          connectLink,
        }),
        {
          dismissOnEscPress: false,
          showCloseButton: false,
        }
      );

      unsupportedCryptoCurDialog.$('.js-connect')
        .on('click', () => app.connectionManagmentModal.open());

      serverConnectEvents.once('connected', () => unsupportedCryptoCurDialog.remove());

      return;
    }

    app.profile = new Profile({ peerID: data.peerID });
    app.router.onProfileSet();
    app.settings = new Settings();

    const curConn = getCurrentConnection();

    if (curConn && curConn.status !== 'disconnected') {
      app.pageNav.torIndicatorOn = app.serverConfig.tor && curConn.server.get('useTor');

      const serverCur = getServerCurrency();

      if (serverCur.code === 'ZEC') {
        startupConnectMessaging.setState({
          msg: app.polyglot.t('startUp.connectMessaging.zecBinaryInit', {
            cancelLink: '<a class="js-cancel">' +
              `${app.polyglot.t('startUp.connectMessaging.cancelLink')}</a>`,
          }),
        });
      }
    }

    app.ownFollowing = new Followers([], {
      type: 'following',
      peerId: app.profile.id,
    });

    app.walletBalance = new WalletBalance();
    app.searchProviders = new SearchProvidersCol();

    onboardIfNeeded().done(() => {
      fetchStartupData().done(() => {
        ensureValidSettingsCurrency().done(() => {
          app.pageNav.navigable = true;
          app.pageNav.setAppProfile();
          app.loadingModal.close();

          // add the default search providers
          app.searchProviders.add(defaultSearchProviders, { at: 0 });

          if (app.localSettings.get('shareMetrics')) addMetrics();

          if (externalRoute) {
            // handle opening the app from an an external ob link
            location.hash = `#${externalRoute}`;
          } else if (!location.hash) {
            // If for some reason the route to start on is empty, we'll change it to be
            // the user's profile.
            const href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(`${href}#${app.profile.id}`);
          } else if (curConn.server &&
            curConn.server.id !== localStorage.serverIdAtLastStart) {
            // When switching servers, we'll land on the user page of the new node
            location.hash = `#${app.profile.id}`;
          }

          localStorage.serverIdAtLastStart = curConn && curConn.server && curConn.server.id;

          if (app.localSettings.get('shareMetrics') === undefined) {
            showMetricsModal({
              showCloseButton: false,
              dismissOnEscPress: false,
              showUndecided: true,
            })
              .on('close', () => Backbone.history.start());
          } else {
            Backbone.history.start();
          }

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

          fetchVerifiedMods();
          setInterval(() => fetchVerifiedMods(), 1000 * 60 * 60);

          // have our walletBalance model update from the walletUpdate socket event
          const serverSocket = getSocket();

          if (serverSocket) {
            serverSocket.on('message', (e = {}) => {
              if (e.jsonData.walletUpdate) {
                const parsedData = app.walletBalance.parse({
                  confirmed: e.jsonData.walletUpdate.confirmed,
                  unconfirmed: e.jsonData.walletUpdate.unconfirmed,
                });

                app.walletBalance.set(parsedData);
              }
            });
          }
        });
      });
    });
  });
}

function connectToServer() {
  const server = app.serverConfigs.activeServer;
  let connectAttempt = null;

  startupConnectMessaging
    .setState({
      msg: app.polyglot.t('startUp.connectMessaging.connectAttemptMsg', {
        serverName: server.get('name'),
        cancelLink: '<a class="js-cancel">' +
          `${app.polyglot.t('startUp.connectMessaging.cancelLink')}</a>`,
      }),
    }).on('clickCancel', () => {
      connectAttempt.cancel();
      app.connectionManagmentModal.open();
      app.loadingModal.close();
    });

  connectAttempt = serverConnect(app.serverConfigs.activeServer)
    .done(() => start())
    .fail(() => {
      app.connectionManagmentModal.open();
      app.loadingModal.close();
      serverConnectEvents.once('connected', () => {
        startupConnectMessaging.setState({ msg: '' });
        app.loadingModal.open(startupConnectMessaging);
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
serverConnectEvents.on('disconnected', () => {
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
serverConnectEvents.on('disconnected', () =>
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

/**
 * If the provided server requires a wallet setup, the Wallet Setup modal will be launched.
 * The function returns a promise that resolves when the process is complete.
 */
function setupWallet(server) {
  const deferred = $.Deferred();

  if (server && server.get('builtIn') && server.get('walletCurrency') === undefined) {
    new WalletSetup({ model: server })
      .render()
      .open()
      .on('walletSetupComplete', () => deferred.resolve());
  } else {
    deferred.resolve();
  }

  return deferred.promise();
}

// get the saved server configurations
app.serverConfigs.fetch().done(() => {
  // Migrate any old "built in" configurations containing the 'default' flag to
  // use the new 'builtIn' flag.
  app.serverConfigs.forEach(serverConfig => {
    const isDefault = serverConfig.get('default');
    serverConfig.unset('default');
    const data = {};

    if (typeof isDefault === 'boolean') {
      data.walletCurrency = 'BTC';
      data.builtIn = !!isDefault;
    }

    const configSave = serverConfig.save(data);

    if (!configSave) {
      // developer error or wonky data
      console.error('There was an error migrating the server config, ' +
        `${serverConfig.get('name')}, from the 'default' to the 'built-in' style.`);
    }
  });

  const isBundled = remote.getGlobal('isBundledApp');
  if (!app.serverConfigs.length) {
    // no saved server configurations
    if (isBundled) {
      // for a bundled app, we'll create a
      // "default" one and try to connect
      const defaultConfig = new ServerConfig({
        builtIn: true,
      });

      setupWallet(defaultConfig).done(() => {
        app.serverConfigs.add(defaultConfig);
        app.serverConfigs.activeServer = defaultConfig;
        connectToServer();
      });
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

    if (activeServer.get('builtIn') && !remote.getGlobal('isBundledApp')) {
      // Your active server is the locally bundled server, but you're
      // not running the bundled app. You have bad data!
      activeServer.set('builtIn', false);
    }

    setupWallet(activeServer).done(() => connectToServer());
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

// Handle update events from main.js
ipcRenderer.on('updateChecking', () =>
  showUpdateStatus(app.polyglot.t('update.checking')));
ipcRenderer.on('updateAvailable', () =>
  showUpdateStatus(app.polyglot.t('update.available')));
ipcRenderer.on('updateNotAvailable', () =>
  showUpdateStatus(app.polyglot.t('update.notAvailable')));
ipcRenderer.on('updateError', (e, msg) =>
  showUpdateStatus(app.polyglot.t('update.error', { error: msg }), 'warning'));
ipcRenderer.on('updateReadyForInstall', (e, opts) => updateReady(opts));

// Allow main.js to send messages to the console
ipcRenderer.on('consoleMsg', (e, msg) => console.log(msg));

// manage publishing sockets
let publishingStatusMsg;
let publishingStatusMsgRemoveTimer;
let retryPublishTimeout;

function setPublishingStatus(msg) {
  if (!msg && typeof msg !== 'object') {
    throw new Error('Please provide a msg as an object.');
  }

  msg.duration = 99999999999999;
  clearTimeout(retryPublishTimeout);

  if (!publishingStatusMsg) {
    publishingStatusMsg = app.statusBar.pushMessage({
      ...msg,
    });
    publishingStatusMsg.on('clickRetry', () => {
      setPublishingStatus({
        msg: app.polyglot.t('publish.statusPublishing'),
        type: 'message',
      });

      // some fake latency so if the rety fails immediately, the UI has a chance
      // to update
      clearTimeout(retryPublishTimeout);
      retryPublishTimeout = setTimeout(() => {
        $.post(app.getServerUrl('ob/publish'))
          .fail(jqXhr => {
            setPublishingStatus({
              msg: app.polyglot.t('publish.statusPublishFailed', {
                retryLink: `<a class="js-retry">${app.polyglot.t('publish.retryLink')}</a>`,
              }),
              type: 'warning',
            });

            const failReason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
            openSimpleMessage(
              app.polyglot.t('publish.failedRetryTitle'),
              failReason
            );
          });
      }, 500);
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
          msg: app.polyglot.t('publish.statusPublishing'),
          type: 'message',
        });
      } else if (e.jsonData.status === 'error publishing') {
        setPublishingStatus({
          msg: app.polyglot.t('publish.statusPublishFailed', {
            retryLink: `<a class="js-retry">${app.polyglot.t('publish.retryLink')}</a>`,
          }),
          type: 'warning',
        });
      } else if (e.jsonData.status === 'publish complete') {
        setPublishingStatus({
          msg: app.polyglot.t('publish.statusPublishComplete'),
          type: 'message',
        });

        publishingStatusMsgRemoveTimer = setTimeout(() => {
          publishingStatusMsg.remove();
          publishingStatusMsg = null;
        }, 3000);
      }
    }
  });
});

ipcRenderer.on('close-attempt', (e) => {
  const localServer = remote.getGlobal('localServer');

  if (localServer && localServer.isRunning) {
    localServer.once('exit', () => e.sender.send('close-confirmed'));
    localServer.stop();
  }

  if (localServer && localServer.isStopping) {
    app.pageNav.navigable = false;
    openSimpleMessage(
      app.polyglot.t('localServerShutdownDialog.title'),
      app.polyglot.t('localServerShutdownDialog.body'),
      {
        showCloseButton: false,
        dismissOnEscPress: false,
      }
    ).$el.css('z-index', '9999999'); // always on tippity-top
  } else {
    e.sender.send('close-confirmed');
  }
});

// initialize our listing delete handler
listingDeleteHandler();

if (remote.getGlobal('isBundledApp')) {
  console.log(`%c${app.polyglot.t('consoleWarning.heading')}`,
    'color: red; font-weight: bold; font-size: 50px;');
  console.log(`%c${app.polyglot.t('consoleWarning.line1')}`, 'color: red;');
  console.log(`%c${app.polyglot.t('consoleWarning.line2')}`, 'color: blue;');
}
