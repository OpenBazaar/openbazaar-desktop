import $ from 'jquery';
import Backbone, { Collection } from 'backbone';
import app from './app';
import LocalSettings from './models/LocalSettings';
import ObRouter from './router';
import PageNav from './views/PageNav.js';


// Until we have legitimate profile models interfacing with the server,
// we'll creating a dummy "users" collection with a dummy set of  "user" models
const usersCl = new Collection([
  {
    id: 'QmVGTT729Piv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
    handle: 'bigpickle',
  },
  {
    id: 'Qm11111111iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
  },
  {
    id: 'Qm222222222iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
  },
  {
    id: 'Qm33333333iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
    handle: 'luckylou',
  },
  {
    id: 'Qm44444444iv1kgzh14sRkphaD3n5HraN2eRRNUGdeF6xY',
    handle: 'fatjerry',
  },
]);

// Represents the user who's node this is (i.e. you). Fudging
// it for now.
app.user = usersCl.at(0);

app.router = new ObRouter({ usersCl });
Backbone.history.start();

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

const pageNav = new PageNav();
$('#pageNavContainer').append(pageNav.render().el);
