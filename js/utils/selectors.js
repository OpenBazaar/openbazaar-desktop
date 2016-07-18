import $ from 'jquery';

let $doc;
let $html;
let $body;
let $pageContainer;

export function getDoc() {
  return $doc || ($doc = $(document));
}

export function getHtml() {
  return $html || ($html = $('html'));
}

export function getBody() {
  return $body || ($body = $('body'));
}

export function getPageContainer() {
  return $pageContainer || ($pageContainer = $('#pageContainer'));
}
