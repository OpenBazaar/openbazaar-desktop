import _ from 'underscore';
import { ipcRenderer } from 'electron';
import { stripHtml } from './dom';

let unreadNotifCount = 0;
let unreadChatMsgCount = 0;
let appBarBadgeCount = 0; // an aggregate count of unread notifications + unread chat messages
let notifAudioEl;

export function getAppBarBadgeCount() {
  return appBarBadgeCount;
}

export function setAppBarBadgeCount(count) {
  if (typeof count !== 'number') {
    throw new Error('Please provide a numeric count.');
  }

  if (count !== appBarBadgeCount) {
    appBarBadgeCount = count;
    ipcRenderer.send('set-badge-count', appBarBadgeCount);
  }
}

export function getUnreadNotifCount() {
  return unreadNotifCount;
}

export function setUnreadNotifCount(count) {
  if (typeof count !== 'number') {
    throw new Error('Please provide a numeric count.');
  }

  if (count !== unreadNotifCount) {
    unreadNotifCount = count;
    setAppBarBadgeCount(unreadNotifCount + unreadChatMsgCount);
  }
}

export function getUnreadChatMsgCount() {
  return unreadChatMsgCount;
}

export function setUnreadChatMsgCount(count) {
  if (typeof count !== 'number') {
    throw new Error('Please provide a numeric count.');
  }

  if (count !== unreadChatMsgCount) {
    unreadChatMsgCount = count;
    setAppBarBadgeCount(unreadNotifCount + unreadChatMsgCount);
  }
}

function playNotifSound() {
  if (!document) {
    throw new Error('The document object needs to be available to this function.');
  }

  if (!notifAudioEl) {
    notifAudioEl = document.createElement('audio');
    notifAudioEl.setAttribute('src', '../audio/notification.mp3');
  }

  notifAudioEl.play();
}

export function launchNativeNotification(notifTitle = '', options = {}) {
  if (options.body !== undefined && typeof options.body !== 'string') {
    throw new Error('If providing a notification body, it must be provided ' +
      'as a string.');
  }

  if (typeof notifTitle !== 'string') {
    throw new Error('Please provide the notifTitle as a string.');
  }

  const notifOptions = {
    silent: true,
    ...(_.omit(options || {}, 'onclick', 'onerror')),
    body: options.body ? stripHtml(options.body) : '',
  };

  const notif = new Notification(notifTitle, notifOptions);

  if (typeof options.onclick === 'function') {
    notif.addEventListener('click', notifOptions.onclick);
  }

  if (typeof options.onerror === 'function') {
    notif.addEventListener('error', notifOptions.onerror);
  }

  playNotifSound();

  return notif;
}

