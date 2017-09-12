import $ from 'jquery';
import 'trumbowyg';

$.trumbowyg.svgPath = '../node_modules/trumbowyg/dist/ui/icons.svg';

export const editorOptions = {
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
  const opts = {
    editorOptions: {
      ...editorOptions,
      ...options.editorOptions || {},
    },
    ...options,
  };

  // accept a selector, element, or jQuery object
  const attach = $(attachPoint);

  // create editor
  attach.trumbowyg(opts.editorOptions);

  if (opts.topLevelClass) {
    attach.closest('.trumbowyg')
      .addClass(opts.topLevelClass);
  }

  return attach;
}
