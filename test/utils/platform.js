import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as platform from '../../js/utils/platform';

describe('platform', () => {
  it('correctly identifies whether I\'m on a mac', () => {
    expect(platform.isMac()).to.equal(process.platform === 'darwin');
  });

  it('correctly identifies whether my platform is Windows', () => {
    expect(platform.isWin()).to.equal(process.platform === 'linux');
  });

  it('correctly identifies whether my platform is Linux', () => {
    expect(platform.isLinux()).to.equal(process.platform === 'win32');
  });
});

