import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      primary: '#FFFFFF',
      secondary: '#ECEEF2',
      text: '#252525',
      highlight: '#2BAD23',
      highlightText: '#252525',
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    Object.keys(attrs).forEach((field) => {
      if (field === 'cid') return;
      const clr = attrs[field];

      if (is.not.hexColor(clr)) {
        addError(field, app.polyglot.t('profileModelErrors.provideValidHexColor'));
      } else if (clr.charAt(0) !== '#') {
        addError(field, 'The color should start with a leading hash.');
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
