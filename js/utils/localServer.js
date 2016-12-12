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
    this._debugLog = '';
    this.startAfterStop = () => this.start();
  }

  get isRunning() {
    return this._isRunning;
  }

  start() {
    if (this.pendingStop) {
      this.pendingStop.once('close', this.startAfterStop);
      const debugInfo = 'Attempt to start server while an existing one' +
        ' is the process of shutting down. Will start after shut down is complete.';
      this.log(debugInfo);
      return;
    }

    if (this.isRunning) return;
    this._isRunning = true;

    this.log('Starting local server.');

    this.serverSubProcess = childProcess.spawn(this.serverPath + this.serverFilename, ['start'], {
      detach: false,
      cwd: this.serverPath,
    });

    this.serverSubProcess.stdout.once('data', () => this.trigger('start'));
    this.serverSubProcess.stdout.on('data', buf => this.obServerLog(`${buf}`));

    const stderrcallback = function stderrcallback(err) {
      if (err) {
        console.log(err);
        return err;
      }
      return false;
    };

    this.serverSubProcess.stderr.on('data', buf => {
      fs.appendFile(this.errorLogPath, String(buf), stderrcallback);
      this.obServerLog(`${buf}`, 'STDERR');
    });

    this.serverSubProcess.on('close', code => {
      this.log(`Server closed with ${code}`, 'CLOSE');
      this._isRunning = false;
      this.lastCloseCode = code;
      this.trigger('close', { code });
    });

    this.serverSubProcess.unref();
  }

  stop() {
    if (!this.isRunning) return;

    if (this.pendingStop) {
      this.pendingStop.removeListener('close', this.startAfterStop);
      return;
    }

    this.pendingStop = this.serverSubProcess;
    this.pendingStop.once('close', () => (this.pendingStop = null));
    this.log('Shutting down server');

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
