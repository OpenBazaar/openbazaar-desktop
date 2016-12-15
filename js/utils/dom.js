// todo: check args and write unit test
// http://stackoverflow.com/a/21627295/632806
export function isScrolledIntoView(element) {
  let rect = element.getBoundingClientRect();
  const top = rect.top;
  const height = rect.height;
  let el = element.parentNode;

  do {
    rect = el.getBoundingClientRect();

    if (top <= rect.bottom === false) return false;

    // Check if the element is out of view due to a container scrolling
    if ((top + height) <= rect.top) return false;

    el = el.parentNode;
  } while (el !== document.body);
  // Check its within the document viewport
  return top <= document.documentElement.clientHeight;
}

export function throttle(task, toHertz, withContext = this) {
  const msTimeout = Math.floor(1000.0 / toHertz);
  let notWaiting = true;
  let latestTask;

  const execute = (...args) => task.call(withContext, ...args);

  const flushTask = () => {
    latestTask();
    latestTask = null;
    wait();
  };

  const guard = (...args) => {
    latestTask = () => execute(...args);
    if (notWaiting) flushTask();
  };

  const stopWaiting = () => {
    notWaiting = true;
    if (latestTask) flushTask();
  };

  const wait = () => {
    notWaiting = false;
    setTimeout(stopWaiting, msTimeout);
  };

  return guard;
}

export function filterHTMLString(str, toTagMap) {

}

export function filterDOMTree(root, toTagMap) {

}
