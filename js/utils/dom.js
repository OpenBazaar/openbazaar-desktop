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

export function throttle(handler, fps) {
  const ms = 1000 / fps;
  let wait = false;

  return function throttled(...e) {
    const context = this;

    if (!wait) {
      handler.call(context, ...e);
      wait = true;
      setTimeout(() => { wait = false; }, ms);
    }
  };
}

/**
  Inspired by: https://gist.github.com/bameyrick/0e3ac3b32c0a1af98c1c
**/
export function debounce(func, wait = 1000, immediate = false) {
  let timeout = null;

  return (...args) => {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

