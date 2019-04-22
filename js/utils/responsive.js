import app from '../app';

// functions for determining size and resolution of the window

export function isHiRez() {
  return window.matchMedia('(-webkit-min-device-pixel-ratio: 1.5)').matches;
}

export function isLargeWidth() {
  return window.matchMedia('(min-width: 1500px)').matches;
}

export function isSmallHeight() {
  return window.matchMedia('(max-height: 700px)').matches;
}

function getBackgroundImage(imageHashes = {}, standardSize, responsiveSize, defaultUrl) {
  let imageHash = '';
  let bgImageProperty = '';

  if (isHiRez() && imageHashes && imageHashes[responsiveSize]) {
    imageHash = imageHashes[responsiveSize];
  } else if (imageHashes && imageHashes[standardSize]) {
    imageHash = imageHashes[standardSize];
  }

  if (imageHash) {
    bgImageProperty = `background-image: url(${app.getServerUrl(`ob/images/${imageHash}`)})` +
      `, url(${defaultUrl})`;
  } else {
    bgImageProperty = `background-image: url(${defaultUrl})`;
  }

  return bgImageProperty;
}

export function getAvatarBgImage(avatarHashes = {}, options = {}) {
  const opts = {
    standardSize: 'tiny',
    responsiveSize: 'small',
    defaultUrl: '../imgs/defaultAvatar.png',
    ...options,
  };

  return getBackgroundImage(avatarHashes, opts.standardSize, opts.responsiveSize,
    opts.defaultUrl);
}

export function getListingBgImage(imageHashes = {}, options = {}) {
  const opts = {
    standardSize: 'tiny',
    responsiveSize: 'small',
    defaultUrl: '../imgs/defaultItem.png',
    ...options,
  };

  return getBackgroundImage(imageHashes, opts.standardSize, opts.responsiveSize,
    opts.defaultUrl);
}

