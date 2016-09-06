import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import * as templateHelpers from './templateHelpers';

const templateCache = {};

// todo: write test to test passing in an array of template files.
export default function loadTemplate(templates, callback, root = `${__dirname}/../templates/`) {
  let templatePaths = templates;

  if (!templatePaths) {
    throw new Error('Please provide a path to the template.');
  }

  if (_.isArray(templatePaths)) {
    if (!templatePaths.length) {
      throw new Error('If passing in a list of template files, please provide a non-empty list.');
    }
  } else {
    templatePaths = [templatePaths];
  }

  _.templateSettings.variable = 'ob';

  const compiledTmpls = [];

  templatePaths.forEach((templatePath) => {
    let template = templateCache[templatePath];

    if (!template) {
      const file = fs.readFileSync(path.join(root, templatePath), 'utf8');
      template = _.template(file);
      templateCache[templatePath] = template;
    }

    compiledTmpls.push(template);
  });

  const sendBackTmpls = () => {
    const wrappedTmpls = [];

    compiledTmpls.forEach((compiledTmpl) => {
      const wrappedTmpl = (context) => compiledTmpl({ ...templateHelpers, ...(context || {}) });
      wrappedTmpls.push(wrappedTmpl);
    });

    callback(...wrappedTmpls);
  };

  // todo: if we need more template that we want to provide as template
  // helpers, find a way to abstract it.
  if (!templateHelpers.formErrorTmpl) {
    templateHelpers.formErrorTmpl = 'its coming'; // hack to avoid infinite recursion
    loadTemplate('formError.html', (t) => {
      templateHelpers.formErrorTmpl = t;
      sendBackTmpls();
    });
  } else {
    sendBackTmpls();
  }
}

