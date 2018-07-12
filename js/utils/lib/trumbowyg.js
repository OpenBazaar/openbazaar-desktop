import $ from 'jquery';
import 'trumbowyg';
import app from '../../app';
import { getTrumboLangFileNameByCode } from '../../data/languages';

$.trumbowyg.svgPath = '../node_modules/trumbowyg/dist/ui/icons.svg';

export const defaultEditorOptions = {
  btns: [
    ['formatting'],
    ['bold', 'italic'],
    ['link'],
    ['insertImage'],
    'btnGrp-lists',
    ['horizontalRule'],
  ],

};

export function installRichEditor(attachPoint, options = {}) {
  const lang = getTrumboLangFileNameByCode(app.localSettings.get('language'));

  if (lang && !window.jQuery.trumbowyg.langs[lang]) {
    // eslint-disable-next-line global-require
    require(`../../../node_modules/trumbowyg/dist/langs/${lang}.min.js`);
  }

  options.editorOptions = {
    ...defaultEditorOptions,
    lang,
    ...options.editorOptions || {},
  };

  // accept a selector, element, or jQuery object
  const attach = $(attachPoint);

  // create editor
  attach.trumbowyg(options.editorOptions);

  if (options.topLevelClass) {
    attach.closest('.trumbowyg')
      .addClass(options.topLevelClass);
  }

  return attach;
}
