import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      averageRating: 0,
      ratingCount: 0,
    };
  }
}
