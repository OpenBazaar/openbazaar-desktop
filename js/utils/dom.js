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

