import { expect } from 'chai';
import { describe, it } from 'mocha';
import BaseModel from '../../js/models/BaseModel';
import { Collection } from 'backbone';

class TestParentModel extends BaseModel {
  nested() {
    return {
      nestedModel: BaseModel,
      nestedCollection: Collection,
    };
  }
}

describe('the base model', () => {
  describe('manages nested attributes', () => {
    it('by creating a new instance for each nested attribute when the parent is created', () => {
      const testParent = new TestParentModel();

      expect(testParent.get('nestedModel') instanceof BaseModel).to.equal(true);
      expect(testParent.get('nestedCollection') instanceof Collection).to.equal(true);
    });

    it('by setting attributes on the nested instances when they are set on the parent', () => {
      const testParent = new TestParentModel();

      testParent.set('nestedModel', {
        happy: 'hippo',
      });

      testParent.set('nestedCollection', [{
        nappy: 'nipple',
      }]);

      expect(testParent.get('nestedModel').get('happy')).to.equal('hippo');
      expect(testParent.get('nestedCollection').at(0).get('nappy')).to.equal('nipple');
    });

    it('by ensuring a call to toJSON() on the parent embeds and returns the results of' +
      ' toJSON() of each of the children', () => {
      const testParent = new TestParentModel();

      testParent.get('nestedModel').set('happy', 'hippo');
      testParent.get('nestedCollection').add({ nappy: 'nipple' });

      expect(testParent.toJSON().nestedModel.happy).to.equal('hippo');
      expect(testParent.toJSON().nestedCollection[0].nappy).to.equal('nipple');
    });
  });
});
