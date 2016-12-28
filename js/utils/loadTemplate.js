import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import * as templateHelpers from './templateHelpers';

const templateCache = {};

export default function loadTemplate(templateFile, callback, root = `${__dirname}/../templates/`) {
  if (!templateFile) {
    throw new Error('Please provide a path to the template.');
  }

  _.templateSettings.variable = 'ob';

  let template = templateCache[templateFile];

  if (!template) {
    const file = fs.readFileSync(path.join(root, templateFile), 'utf8');
    template = _.template(file);
    templateCache[templateFile] = template;
  }

  const sendBackTmpl = () => {
    const wrappedTmpl = (context) => template({ ...templateHelpers, ...(context || {}) });
    callback(wrappedTmpl);
  };

  // todo: if we need more templates that we want to provide as template
  // helpers, find a way to abstract it.
  if (!templateHelpers.formErrorTmpl) {
    templateHelpers.formErrorTmpl = 'its coming'; // hack to avoid infinite recursion

    loadTemplate('spinner.svg', (t) => {
      templateHelpers.spinner = t;
    });

    loadTemplate('formError.html', (t) => {
      templateHelpers.formErrorTmpl = t;
      sendBackTmpl();
    });
  } else {
    sendBackTmpl();
  }
}
