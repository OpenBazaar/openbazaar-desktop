// process.platform: Possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
export function isMac() {
  return process.platform === 'darwin';
}

export function isWin() {
  return process.platform === 'win32';
}

export function isLinux() {
  return process.platform === 'linux';
}
