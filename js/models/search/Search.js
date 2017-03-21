import BaseModel from '../BaseModel';
import app from '../../app';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      logo: '',
      options: [],
      sortBy: [],
      suggestions: [],
      listings: [],
      vendors: [],
      moderators: [],
      nodes: [],
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('name', app.polyglot.t('search.errors.noName'));
    }
  }
}
