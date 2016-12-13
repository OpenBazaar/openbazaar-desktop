import $ from 'jquery';
import 'trumbowyg';

export default class {
  static install() {
    $('textarea').each( el => $(el).trumbowyg() );
  }
}
