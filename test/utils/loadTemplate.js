import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import fs from 'fs';
import path from 'path';
import loadTemplate from '../../js/utils/loadTemplate';

const dummyTemplatePath = path.join(__dirname, '../../.tmp/test');
const dummyTemplatePathFromRoot = '.tmp/test';
const dummyTemplateFile = 'test.html';
const dummyTemplateContents = 'my name is <%= ob.name %>';

describe('loading a template', () => {
  before(function () {
    if (!fs.existsSync(dummyTemplatePath)) {
      fs.mkdirSync(dummyTemplatePath);
    }

    fs.writeFileSync(path.join(dummyTemplatePath, dummyTemplateFile), dummyTemplateContents);
  });

  // first time we load a template, it retrieves it from the file-system
  // and returns a compiled template
  it('for the first time, reads the template from the file system', () => {
    let output;

    loadTemplate(path.join(dummyTemplatePathFromRoot, dummyTemplateFile), (t) => {
      output = t({ name: 'billy' });
    }, './');

    expect(output).to.equal('my name is billy');
  });

  // After the first time we load a template, subsequent requests do not
  // go to the file system. Instead, a cached, compiled template is returned.
  it('after the first time, returns a cached template', () => {
    let output;

    fs.writeFileSync(path.join(dummyTemplatePath, dummyTemplateFile),
      `${dummyTemplateContents} updated!!!`);

    loadTemplate(path.join(dummyTemplatePathFromRoot, dummyTemplateFile), (t) => {
      output = t({ name: 'billy' });
    });

    expect(output).to.equal('my name is billy');
  });

  after(function () {
    fs.unlinkSync(path.join(dummyTemplatePath, dummyTemplateFile));
  });
});

