import $ from 'jquery';
import 'trumbowyg';

$.trumbowyg.svgPath = '../node_modules/trumbowyg/dist/ui/icons.svg';

export const editorOptions = {
  btns: [
    ['formatting'],
    ['bold', 'italic'],
    ['link'],
    ['insertImage'],
    'btnGrp-justify',
    'btnGrp-lists',
  ],
};

export function installRichEditor(attachPoint) {
  // accept a selector, element, or jQuery object
  const attach = $(attachPoint);

  // create editor
  attach.trumbowyg(editorOptions);
}
