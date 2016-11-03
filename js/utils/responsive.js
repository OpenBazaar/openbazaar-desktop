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

