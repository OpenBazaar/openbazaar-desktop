import $ from 'jquery';
import Backbone, { Collection } from 'backbone';
import app from './app';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';
import LoadingModal from './views/modals/Loading';
import SimpleMessageModal from './views/modals/SimpleMessage';

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

// Represents the user who's node this is (i.e. you). Fudging
// it for now.
app.user = usersCl.at(0);

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

const pageNav = new PageNav();
$('#pageNavContainer').append(pageNav.render().el);

app.router = new ObRouter({
  usersCl,
  pageNavVw: pageNav,
});

app.loadingModal.close();

// start history
Backbone.history.start();
