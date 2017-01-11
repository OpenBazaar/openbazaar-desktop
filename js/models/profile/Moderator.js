import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      description: '',
      termsAndConditions: '',
      languages: [],
    };
  }

  // look at moderator proto to determine nested models
  // https://github.com/OpenBazaar/openbazaar-go/blob/master/pb/protos/moderator.proto
  //
  // get nested() {
  //   return {
  //     social: SocialAccounts,
  //     avatarHashes: Image,
  //     headerHashes: Image,
  //     modInfo: Moderator,
  //   };
  // }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.description) {
      // todo: translate any error messages the user may see
      addError('description', 'Please provide a description.');
    }

    // todo: more validations -
    // - termsAndConditions max length
    // - descirpiont max length??
    // - are all lang codes provided valid codes based
    //   on our utils/languages module (which needs to
    //   be built up).
    // etc...

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
