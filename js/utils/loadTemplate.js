import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import * as templateHelpers from './templateHelpers';

const templateCache = {};

export default function (templateFile, callback, root = `${__dirname}/../templates/`) {
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

  const wrappedTmpl = (context) => template({ ...templateHelpers, ...(context || {}) });

  callback(wrappedTmpl);
}
