import { expect } from 'chai';
import { describe, it } from 'mocha';
import Image from '../../../js/models/listing/Image';

describe('the Image model', () => {
  it('fails validation if a filename exceeds the max length', () => {
    const image = new Image();
    let filename = '';

    for (let i = 0; i < Image.maxFilenameLength + 1; i++) {
      filename += 'M';
    }

    image.set({ filename }, { validate: true });
    const valErr = image.validationError;

    expect(valErr && valErr.filename && !!valErr.filename.length || false).to.equal(true);
  });
});
