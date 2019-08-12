import $ from 'jquery';
import app from '../app';
import { shell } from 'electron';
import Backbone from 'backbone';
import { getPageContainer } from './selectors';
import TorExternalLinkWarning from '../views/modals/TorExternalLinkWarning';


// todo: check args and write unit test
// http://stackoverflow.com/a/21627295/632806
export function isScrolledIntoView(element) {
  let rect = element.getBoundingClientRect();
  const top = rect.top;
  const height = rect.height;
  let el = element.parentNode;

  do {
    rect = el.getBoundingClientRect();

    if (top <= rect.bottom === false) return false;

    // Check if the element is out of view due to a container scrolling
    if ((top + height) <= rect.top) return false;

    el = el.parentNode;
  } while (el !== document.body);
  // Check its within the document viewport
  return top <= document.documentElement.clientHeight;
}

// http://stackoverflow.com/a/41426040/632806
export function insertAtCursor(myField, myValue) {
  if (document.selection) {
    // IE support
    myField.focus();
    const sel = document.selection.createRange();
    sel.text = myValue;
  } else if (window.navigator.userAgent.indexOf('Edge') > -1) {
    // Microsoft Edge
    const startPos = myField.selectionStart;
    const endPos = myField.selectionEnd;

    myField.value = myField.value.substring(0, startPos) + myValue
      + myField.value.substring(endPos, myField.value.length);

    const pos = startPos + myValue.length;
    myField.focus();
    myField.setSelectionRange(pos, pos);
  } else if (myField.selectionStart || myField.selectionStart === '0') {
    // MOZILLA and others
    const startPos = myField.selectionStart;
    const endPos = myField.selectionEnd;
    myField.value = myField.value.substring(0, startPos)
      + myValue
      + myField.value.substring(endPos, myField.value.length);
  } else {
    myField.value += myValue;
  }
}

/**
 * Returns a string of text with html stripped out.
 * (https://stackoverflow.com/a/822486/632806)
 */
export function stripHtml(text) {
  if (typeof text !== 'string') {
    throw new Error('Please provide text as a string.');
  }

  const el = document.createElement('div');
  el.innerHTML = text;
  return el.textContent || el.innerText || '';
}

export function openExternal(href) {
  if (typeof href !== 'string') {
    throw new Error('Please provide a valid href as string.');
  }

  const activeServer = app.serverConfigs.activeServer;
  const localSettings = app.localSettings;
  const warningOptedOut = app.localSettings &&
    localSettings.get('dontShowTorExternalLinkWarning');

  if (activeServer && activeServer.get('useTor') && !warningOptedOut) {
    const warningModal = new TorExternalLinkWarning({ url: href })
      .render()
      .open();

    warningModal.on('cancelClick', () => warningModal.close());
    warningModal.on('confirmClick', () => {
      shell.openExternal(href);
      warningModal.close();
    });
  } else {
    shell.openExternal(href);
  }
}

/**
 * For most cases, this handler will be able to identify an external link because
 * it will be prefaced with an "external" protocol (e.g. http, ftp). An exception
 * to this is any user based url (e.g. www.espn.com). In that case, add a
 * 'data-open-external' attribute to the url to force it to be opened externally.
 */
export function handleLinks(el) {
  $(el).on('click', 'a:not([data-bypass])', (e) => {
    const $a = $(e.target).closest('a');
    const openExternally = $a.data('openExternal') !== undefined;
    let href = $a.attr('href');

    // Anchor without href is likely being handled programmatically.
    if (!href) return;

    // Ignore javascript:void(0) links such as in selectize's close buttons.
    if (href.startsWith('javascript')) return;

    const link = document.createElement('a');
    link.setAttribute('href', href);

    if (link.protocol !== location.protocol || openExternally) {
      if (link.protocol === 'ob:' && !openExternally) {
        Backbone.history.navigate(href.slice(5), true);
      } else {
        openExternal(link.protocol === 'file:' ? `http://${href}` : link.href);
      }
    } else {
      if (!href.startsWith('#')) {
        href = `#${href}`;
      }

      Backbone.history.navigate(href, true);
    }

    e.preventDefault();
  });
}

/**
 * This will scroll the pageContainer to the top of the contentFrame. Use this when calling
 * scrollIntoView on a page view's root element doesn't scroll the pageContainer to zero.
 */
export function scrollPageIntoView() {
  getPageContainer()[0].scrollIntoView();
}
