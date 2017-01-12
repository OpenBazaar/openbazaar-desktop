import $ from 'jquery';

let $html;
let $body;
let $pageContainer;
let $chatContainer;
let $appFrame;
let $contentFrame;

export function getHtml() {
  return $html || ($html = $('html'));
}

export function getBody() {
  return $body || ($body = $('body'));
}

export function getPageContainer() {
  return $pageContainer || ($pageContainer = $('#pageContainer'));
}

export function getChatContainer() {
  return $chatContainer || ($chatContainer = $('#chatContainer'));
}

export function getAppFrame() {
  return $appFrame || ($appFrame = $('#appFrame'));
}

export function getContentFrame() {
  return $contentFrame || ($contentFrame = $('#contentFrame'));
}
