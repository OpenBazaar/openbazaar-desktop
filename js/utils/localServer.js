import _ from 'underscore';
import { EOL, platform } from 'os';
import { Events } from 'backbone';
import fs from 'fs';
import childProcess from 'child_process';

export default class LocalServer {
  constructor(options) {
    if (!options.serverPath) {
      throw new Error('Please provide a server path.');
    }

    if (!options.serverFilename) {
      throw new Error('Please provide a server filename.');
    }

    if (!options.errorLogPath) {
      throw new Error('Please provide an error log path.');
    }

    _.extend(this, Events);
    this.serverPath = options.serverPath;
    this.serverFilename = options.serverFilename;
    this.errorLogPath = options.errorLogPath;
    this._isRunning = false;
    this._isStopping = false;
    this._debugLog = '';
    this.startAfterStop = () => this.start();
  }

  get isRunning() {
    return this._isRunning;
  }

  get isStopping() {
    return this._isStopping;
  }

  start() {
    if (this.pendingStop) {
      this.pendingStop.once('exit', this.startAfterStop);
      const debugInfo = 'Attempt to start server while an existing one' +
        ' is the process of shutting down. Will start after shut down is complete.';
      this.log(debugInfo);
      return;
    }

    if (this.isRunning) return;
    this._isRunning = true;

    this.log('Starting local server.');
    console.log('Starting local server.');

    this.serverSubProcess = childProcess.spawn(this.serverPath + this.serverFilename, ['start'], {
      detach: false,
      cwd: this.serverPath,
    });

    this.serverSubProcess.stdout.once('data', () => this.trigger('start'));
    this.serverSubProcess.stdout.on('data', buf => this.obServerLog(`${buf}`));

    this.serverSubProcess.on('error', err => {
      const errOutput = `The local server child process has an error: ${err}`;

      fs.appendFile(this.errorLogPath, errOutput, (appendFileErr) => {
        if (appendFileErr) {
          console.log(`Unable to write to the error log: ${err}`);
        }
      });

      this.log(errOutput);
    });

    this.serverSubProcess.stderr.on('data', buf => {
      fs.appendFile(this.errorLogPath, String(buf), (err) => {
        if (err) {
          console.log(`Unable to write to the error log: ${err}`);
        }
      });

      this.obServerLog(`${buf}`, 'STDERR');
    });

    this.serverSubProcess.on('exit', (code, signal) => {
      let logMsg;

      if (code !== null) {
        logMsg = `Server exited with code: ${code}`;
      } else {
        logMsg = `Server exited at request of signal: ${signal}.`;
      }

      console.log(logMsg);
      this.log(logMsg, 'EXIT');
      this._isRunning = false;
      this.lastCloseCode = code;
      this.trigger('exit', { code });
    });

    this.serverSubProcess.unref();
  }

  stop() {
    if (!this.isRunning) return;

    if (this.pendingStop) {
      this.pendingStop.removeListener('exit', this.startAfterStop);
      return;
    }

    this._isStopping = true;
    this.pendingStop = this.serverSubProcess;
    this.pendingStop.once('exit', () => {
      this.pendingStop = null;
      this._isStopping = false;
    });

    this.log('Shutting down server');
    console.log('Shutting down server');

    if (platform() === 'darwin' || platform() === 'linux') {
      this.serverSubProcess.kill('SIGINT');
    } else {
      this.childProcess.spawn('taskkill', ['/pid', this.serverSubProcess.pid, '/f', '/t']);
    }
  }

  get debugLog() {
    return this._debugLog;
  }

  _log(msg, type = 'LOCAL-SERVER') {
    const newLog = `[${type}] ${msg}${msg.endsWith(EOL) ? '' : EOL}`;
    this._debugLog += newLog;
    this.trigger('log', this, newLog);
  }

  log(msg) {
    if (typeof msg !== 'string') {
      throw new Error('Please provide a message.');
    }

    if (!msg) return;
    this._log(msg);
  }

  obServerLog(msg, type = 'STDOUT') {
    if (typeof msg !== 'string') {
      throw new Error('Please provide a message.');
    }

    if (!msg) return;
    console.log(msg);

    const msgPreface = type ? `[${type}] ` : '';
    msg.split(EOL).forEach(splitMsg =>
      this._log(`${msgPreface}${splitMsg}`, '[OB-SERVER]'));
  }
}
