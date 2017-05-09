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

export function getAvatarBgImage(avatarHashes = {}, defaultAvatar = '../imgs/defaultAvatar.png') {
  let avatarHash = '';
  let bgImageProperty = '';

  if (isHiRez() && avatarHashes.small) {
    avatarHash = avatarHashes.small;
  } else if (avatarHashes.tiny) {
    avatarHash = avatarHashes.tiny;
  }

  if (avatarHash) {
    bgImageProperty = `background-image: url(${app.getServerUrl(`ipfs/${avatarHash}`)})` +
      `, url(${defaultAvatar})`;
  } else {
    bgImageProperty = `background-image: url(${defaultAvatar})`;
  }

  return bgImageProperty;
}

export function getListingBgImage(imageHashes = {}, defaultListing = '../imgs/defaultItem.png') {
  let imageHash = '';
  let bgImageProperty = '';

  if (isHiRez() && imageHashes.small) {
    imageHash = imageHashes.small;
  } else if (imageHashes.tiny) {
    imageHash = imageHashes.tiny;
  }

  if (imageHash) {
    bgImageProperty = `background-image: url(${app.getServerUrl(`ipfs/${imageHash}`)})` +
        `, url(${defaultListing})`;
  } else {
    bgImageProperty = `background-image: url(${defaultListing})`;
  }

  return bgImageProperty;
}

