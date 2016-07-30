import $ from 'jquery';
import Backbone, { Collection } from 'backbone';
import './lib/whenAll.jquery';
import app from './app';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import SimpleMessageModal from './views/modals/SimpleMessage';
import Dialog from './views/modals/Dialog';
import Profile from './models/Profile';
import Settings from './models/Settings';


$.ajaxSetup({
  // todo: for now busting cache on fetches pending
  // issue where my server is not running the latest
  // code which has removed cache headers.
  cache: false,
});

// Until we have legitimate profile models interfacing with the server,
// we'll create a dummy "users" collection with a dummy set of  "user" models
const usersCl = new Collection([
  {
    id: 'Qm63bf1a74e69375b5b53e940a057e072b4c5fa0a0',
    handle: 'sampatt',
  },
  {
    id: 'Qm11111111iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
  },
  {
    id: 'Qm222222222iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
  },
  {
    id: 'Qmbbb75ac9028dd8aca7acb236b5dd7c4dfd9b5bc8',
    handle: 'themes',
  },
  {
    id: 'Qma06aa22a38f0e62221ab74464c311bd88305f88c',
    handle: 'openbazaar',
  },
]);

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

app.pageNav = new PageNav();
$('#pageNavContainer').append(app.pageNav.render().el);

app.router = new ObRouter({ usersCl });

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
let onboardingProfileRequired = false;
let onboardingSettingsRequired = false;
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
          if (jqXhr.status === 400) {
            // for now we'll consider 400 - Bad Request to mean
            // onboarding is needed. After some pending server changes
            // 404 should mean onboarding is needed.
            // todo: follow up with cpacia to ensure the server change is
            // made.
            onboardingProfileRequired = true;
            profileFailed = false;
          } else {
            profileFailed = true;
          }
        } else if (jqXhr === settingsFetch) {
          if (jqXhr.responseJSON && jqXhr.responseJSON.reason === 'sql: no rows in result set') {
            onboardingSettingsRequired = true;
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
      if (profileFailed || settingsFailed) {
        const retryOnboardingModelsDialog = new Dialog({
          title: 'Unable to get your profile and settings data.',
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
      } else if (onboardingProfileRequired || onboardingSettingsRequired) {
        onboardingNeededDeferred.resolve(true, {
          onboardProfile: onboardingProfileRequired,
          onboardSettings: onboardingSettingsRequired,
        });
      }
    });

  return onboardingNeededDeferred.promise();
}

// let's start our flow
fetchConfig().done((data) => {
  app.profile = new Profile({ id: data.guid });
  app.settings = new Settings();

  isOnboardingNeeded().done((onboardingNeeded, details) => {
    if (onboardingNeeded) {
      // let's go onboard
      console.log(JSON.stringify(details));
    } else {
      console.log('start app yo');
    }
  });
});


// if both succeed
// if profile has a jqXhr status of 400, onboarding needed for profile
// if settings fails with reason 'sql: no rows in result set', onboarding needed for settings
//

// $.get(app.getServerUrl('ob/config')).done((data) => {
//   app.profile = new Profile({ id: data.guid });

//   // todo: for now busting cache on fetch pending
//   // issue where my server is not running the latest
//   // code which solves this.
//   app.profile.fetch({ cache: false })
//     .done(() => {
//       app.pageNav.navigable = true;
//       Backbone.history.start();
//       app.loadingModal.close();
//     }).fail((jqXhr) => {
//       if (jqXhr.status === 400) {
//         // for now we'll consider 400 - Bad Request to mean
//         // onboarding is needed. After some pending server changes
//         // 404 should mean onboarding is needed.
//         // todo: follow up with cpacia to ensure the server change is
//         // made.

//         // for now we'll just manually save the profile with
//         // some default / dummy values. Later, we'll make the
//         // onboarding modal.

//         const profileSave = app.profile.save({}, {
//           type: 'POST',
//         });

//         if (!profileSave) {
//           throw new Error('Client side validation failed on your new Profile model.' +
//             'Ensure your defaults are valid.');
//         } else {
//           profileSave.done(() => {
//             app.pageNav.navigable = true;
//             Backbone.history.start();
//             app.loadingModal.close();
//           }).fail((failData) => {
//             app.loadingModal.close();
//             new SimpleMessageModal()
//               .render()
//               .open('Unable To Save Profile', failData.reason || '');
//           });
//         }
//       } else {
//         app.loadingModal.close();
//         new SimpleMessageModal()
//           .render()
//           .open('Unable To Get Profile');
//       }
//     });
// }).fail(() => {
//   app.loadingModal.close();
//   new SimpleMessageModal()
//     .render()
//     .open('Unable to obtain the server configuration.', 'Is your server running?');
// });

// console.log('moo');
// window.moo = new Settings();
