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

// http://stackoverflow.com/a/41426040/632806
export function insertAtCursor(myField, myValue) {
  if (document.selection) {
    // IE support
    myField.focus();
    const sel = document.selection.createRange();
    sel.text = myValue;
  } else if (window.navigator.userAgent.indexOf('Edge') > -1) {
    // Microsoft Edge
    const startPos = myField.selectionStart;
    const endPos = myField.selectionEnd;

    myField.value = myField.value.substring(0, startPos) + myValue
      + myField.value.substring(endPos, myField.value.length);

    const pos = startPos + myValue.length;
    myField.focus();
    myField.setSelectionRange(pos, pos);
  } else if (myField.selectionStart || myField.selectionStart === '0') {
    // MOZILLA and others
    const startPos = myField.selectionStart;
    const endPos = myField.selectionEnd;
    myField.value = myField.value.substring(0, startPos)
      + myValue
      + myField.value.substring(endPos, myField.value.length);
  } else {
    myField.value += myValue;
  }
}
