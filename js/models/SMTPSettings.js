import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      Notifications: true,
    };
  }
}
