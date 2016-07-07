// https://github.com/jeromegn/Backbone.localStorage

// We are wrapping the above Backbone localStorage adapter to slightly
// change its behavior. By default, it overrides Backbone.sync globally,
// forcing all models and collections to sync to localStorage
// We are modifying it to leave the default sync in tact, and you can opt in on
// a per model / collection basis by setting it's sync method to
// Backbone.LocalStorage.sync. You also still need to set the localStorage attribute,
// as described in the docs.

import Backbone from 'backbone';
// eslint-disable-next-line no-unused-vars
import localStorageSync from 'backbone.localstorage';

Backbone.sync = Backbone.ajaxSync;
delete Backbone.ajaxSync;

export default Backbone.LocalStorage;
