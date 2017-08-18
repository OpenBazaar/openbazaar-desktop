/* Used as a list item of both follower and following lists */

import BaseModel from './BaseModel';

export default class extends BaseModel {
  get idAttribute() {
    return 'peerId';
  }
}

