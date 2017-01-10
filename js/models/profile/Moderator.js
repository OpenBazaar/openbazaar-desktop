import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      description: '',
      termsAndConditions: '',
      languages: [],
    };
  }

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
      addError('name', 'Please provide a name.');

      // todo: more validations -
      // - termsAndConditions max length
      // - descirpiont max length??
      // - are all lang codes provided valid codes based
      //   on our utils/languages module (which needs to
      //   be built up).
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
