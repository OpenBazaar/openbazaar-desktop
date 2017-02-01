import { expect } from 'chai';
import { describe, it } from 'mocha';
import BaseModel from '../../js/models/BaseModel';
import { Collection } from 'backbone';

class TestParentModel extends BaseModel {
  defaults() {
    return {
      nestedModel: new BaseModel(),
      nestedCollection: new Collection(),
    };
  }

  nested() {
    return {
      nestedModel: BaseModel,
      nestedModel2: BaseModel, // optional (i.e. not declared in defaults())
      nestedCollection: Collection,
      nestedCollection2: Collection, // optional (i.e. not declared in defaults())
    };
  }
}

describe('the base model', () => {
  describe('manages nested attributes', () => {
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

    it('by creating a new instance for any nested attributes the first time they' +
      ' are set via the parent', () => {
      const testParent = new TestParentModel();

      testParent.set('nestedModel2', {
        happy: 'hippo',
      });

      testParent.set('nestedCollection2', [{
        nappy: 'nipple',
      }]);

      expect(testParent.get('nestedModel') instanceof BaseModel).to.equal(true);
      expect(testParent.get('nestedCollection') instanceof Collection).to.equal(true);
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
