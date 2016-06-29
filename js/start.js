import $ from 'jquery';
import PageNav from './views/PageNav.js';

const pageNav = new PageNav();
$('#pageNavContainer').append(pageNav.render().el);
