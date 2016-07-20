import $ from 'jquery';
import Backbone, { Collection } from 'backbone';
import app from './app';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import SimpleMessageModal from './views/modals/SimpleMessage';
import Profile from './models/Profile';

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

// create and launch loading modal
app.loadingModal = new LoadingModal({
  dismissOnOverlayClick: false,
  dismissOnEscPress: false,
  showCloseButton: false,
}).render().open();

// create our re-usable simple message modal instance
app.simpleMessageModal = new SimpleMessageModal({ removeOnClose: false }).render();
app.simpleMessageModal._origRemove = app.simpleMessageModal.remove;
app.simpleMessageModal.remove = () => {
  throw new Error('This is a shared instance that should not be removed.');
};

app.pageNav = new PageNav();
$('#pageNavContainer').append(app.pageNav.render().el);

app.router = new ObRouter({ usersCl });

// get the server config
$.get(app.getServerUrl('ob/config')).done((data) => {
  app.profile = new Profile({ id: data.guid });

  // console.log('hello');
  // window.hello = app.profile;
  // window.hello.on('change', () => {
  //   console.log('the times are a changin');
  // });

  app.profile.fetch()
    .done(() => {
      app.pageNav.navigable = true;
      Backbone.history.start();
      app.loadingModal.close();
    }).fail((jqXhr) => {
      if (jqXhr.status === 400) {
        // for now we'll consider 400 - Bad Request to mean
        // onboarding is needed. After some pending server changes
        // 404 should mean onboarding is needed.
        // todo: follow up with cpacia to ensure the server change is
        // made.

        // for now we'll just manually save the profile with
        // some default / dummy values. Later, we'll make the
        // onboarding modal.

        const profileSave = app.profile.save({}, {
          type: 'POST',
        });

        if (!profileSave) {
          throw new Error('Client side validation failed on your new Profile model.' +
            'Ensure your defaults are valid.');
        } else {
          profileSave.done(() => {
            app.pageNav.navigable = true;
            Backbone.history.start();
            app.loadingModal.close();
          }).fail((failData) => {
            app.loadingModal.close();
            app.simpleMessageModal.open('Unable To Save Profile', failData.reason || '');
          });
        }
      } else {
        app.loadingModal.close();
        app.simpleMessageModal.open('Unable To Get Profile');
      }
    });
});
