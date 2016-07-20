import $ from 'jquery';

let $html;
let $body;
let $pageContainer;
let $appFrame;

export function getHtml() {
  return $html || ($html = $('html'));
}

export function getBody() {
  return $body || ($body = $('body'));
}

export function getPageContainer() {
  return $pageContainer || ($pageContainer = $('#pageContainer'));
}

export function getAppFrame() {
  return $appFrame || ($appFrame = $('#appFrame'));
}
