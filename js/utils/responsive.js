// functions for determining size and resolution of the window

export function getHiRez() {
  return window.matchMedia('(-webkit-min-device-pixel-ratio: 1.5)').matches;
}

export function getLargeWidth() {
  return window.matchMedia('(min-width: 1500px)').matches;
}

export function getSmallHeight() {
  return window.matchMedia('(max-height: 700px)').matches;
}

