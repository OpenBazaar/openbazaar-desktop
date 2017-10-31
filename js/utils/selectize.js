/*
  A wrapper for the selectize jquery element. A tweaked version of it is in the lib folder.
*/

export const tagsDelimiter = '<=!=>';
import '../lib/selectize';
// hack to work around the circular dependance issue and expose the
// tags delimiter to the '../lib/selectize' module. Only that module
// should ever have to import _tagsDelimiter - all others could import
// the 'tagsDelimiter' const. If we ever change the delimiter, both instances
// in this file should be changed.
export function _tagsDelimiter() {
  return '<=!=>';
}

