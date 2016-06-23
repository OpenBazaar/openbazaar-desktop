import $ from 'jquery';

// bootstrap in BrowserSync
// https://github.com/BrowserSync/browser-sync/issues/1128
$.ajax('http://localhost:3000/browser-sync/browser-sync-client.2.13.0.js').done((data) => {
  $('<script />').appendTo($('body'))
    .text(data.replace('location.hostname', '(location.hostname || \'localhost\')'));
});
