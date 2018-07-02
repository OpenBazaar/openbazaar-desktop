import $ from 'jquery';
import 'trumbowyg';
import app from '../../app';

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
  const language = app.localSettings.get('language');

  options.editorOptions = {
    ...defaultEditorOptions,
    lang: language,
    ...options.editorOptions || {},
  };

  console.log(`trumboOptions: ${JSON.stringify(options.editorOptions)}`);
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
