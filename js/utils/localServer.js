import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import { EOL, platform } from 'os';
import { Events } from 'backbone';

const daemon = platform() === 'darwin' || platform() === 'linux' ?
  'openbazaard' : 'openbazaard.exe';
console.log('iasojdoiasjdaoisd === > foo bar');
let _isRunning = false;
let serverSubProcess;
let debugLog = '';
let pendingStop;
let startAfterStop = () => {};

const events = {
  ...Events,
};

export { events };

// export const serverPath = `${__dirname}${path.sep}..${path.sep}OpenBazaar-Server${path.sep}`;
export const serverPath = `${__dirname}${path.sep}..${path.sep}..${path.sep}..${path.sep}test-server${path.sep}`;

export function isRunning() {
  console.log('=====> ill give you ' + _isRunning);
  return _isRunning;
}

export function startLocalServer() {
  if (pendingStop) {
    pendingStop.once('close', startAfterStop);
    const debugInfo = '[SERVER-INFO] Attempt to start server while an existing one is the process' +
      ' of shutting down. Will start after shut down is complete.';
    debugLog += `${debugInfo}${EOL}`;
    console.log(debugInfo);
    return;
  }

  if (isRunning()) return;

  console.log('[SERVER-INFO] Starting OpenBazaar Server');
  debugLog += `[SERVER-INFO] Starting Server${EOL}`;

  serverSubProcess = childProcess.spawn(serverPath + daemon, ['start'], {
    detach: false,
    cwd: serverPath,
  });

  _isRunning = true;
  console.log('[SERVER-OUT] IAM AM AM I AM RUNNing ' + isRunning());
  events.trigger('start');

  serverSubProcess.stdout.on('data', buf => {
    console.log('[SERVER-OUT] "%s"', String(buf));
    debugLog += `[SERVER-OUT] ${buf}${EOL}`;
  });

  const stderrcallback = function stderrcallback(err) {
    if (err) {
      console.log(err);
      return err;
    }
    return false;
  };

  serverSubProcess.stderr.on('data', buf => {
    console.log('[SERVER-ERR] "%s"', String(buf));
    fs.appendFile(`${__dirname}${path.sep}..${path.sep}..${path.sep}error.log`, String(buf), stderrcallback);
    debugLog += `[SERVER-ERR] ${buf}${EOL}`;
  });

  serverSubProcess.on('close', code => {
    console.log(`[SERVER-INFO] server closed with ${code}`);
    debugLog += `[SERVER-INFO] Server closed with ${code}${EOL}`;
    events.trigger('stop');
    _isRunning = false;
  });

  serverSubProcess.unref();
}

startAfterStop = () => startLocalServer();

export function stopLocalServer() {
  if (!isRunning()) return;

  if (pendingStop) {
    pendingStop.removeListener('close', startAfterStop);
    return;
  }

  pendingStop = serverSubProcess;

  pendingStop.once('close', () => (pendingStop = null));

  const debugInfo = '[SERVER-INFO] Shutting down server';
  console.log(debugInfo);
  debugLog += `${debugInfo}${EOL}`;

  if (platform() === 'darwin' || platform() === 'linux') {
    console.log('UNO UNO UNO');
    serverSubProcess.kill('SIGINT');
  } else {
    console.log('DOS DOS DOS');
    // childProcess.spawn('taskkill', ['/pid', serverSubProcess.pid, '/f', '/t']);
  }
}

export function getDebugLog() {
  return debugLog;
}
