import { remote } from 'electron';

// handles mouse back/forward buttons

export default function () {

  // app-command works on Windows only
  $(window).on("app-command", (e, cmd) => {
    if (cmd === 'browser-backward') {
      window.history.back();
    } else if (cmd === 'browser-forward') {
      window.history.forward();
    }
  });


  if (process.platform === 'linux') {
    require('mouse-forward-back').register((button) => {
      if (button === 'back') {
        window.history.back();
      } else if (button === 'forward') {
        window.history.forward();
      }
    }, remote.getCurrentWindow().getNativeWindowHandle());
  }
}
