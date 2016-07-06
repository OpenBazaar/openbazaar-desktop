import $ from 'jquery';
import app from './app';
import LocalSettings from './models/LocalSettings';
import PageNav from './views/PageNav.js';

app.localSettings = new LocalSettings({ id: 1 });
app.localSettings.fetch().fail(() => app.localSettings.save());

const pageNav = new PageNav();
$('#pageNavContainer').append(pageNav.render().el);
