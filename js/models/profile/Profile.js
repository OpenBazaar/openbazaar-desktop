import $ from 'jquery';
import app from '../../app';
import { getSocket } from '../../utils/serverConnect';
import { decimalToInteger, integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';
import Image from './Image';
import Moderator from './Moderator';
import Colors from './Colors';
import Contact from './Contact';

export default class Profile extends BaseModel {
  defaults() {
    return {
      about: '',
      handle: '',
      location: '',
      moderator: false,
      name: `OB ${(Math.floor(Math.random() * 2116316159) + 60466176).toString(36)}`,
      nsfw: false,
      shortDescription: '',
      avatarHashes: new Image(),
      headerHashes: new Image(),
      vendor: true,
      colors: new Colors(),
      contactInfo: new Contact(),
      stats: new BaseModel(),
    };
  }

  url() {
    return app.getServerUrl(`ob/profile/${this.id}`);
  }

  // todo: set peerId instead of ID when setting ID.
  get idAttribute() {
    return 'peerID';
  }

  get nested() {
    return {
      avatarHashes: Image,
      headerHashes: Image,
      moderatorInfo: Moderator,
      colors: Colors,
      contactInfo: Contact,
      stats: BaseModel,
    };
  }

  get isModerator() {
    return this.get('moderator') &&
      !!this.get('moderatorInfo');
  }

  get max() {
    return {
      locationLength: 100,
      shortDescriptionLength: 160,
    };
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.name) {
      addError('name', app.polyglot.t('profileModelErrors.provideName'));
    }

    if (attrs.handle && attrs.handle.charAt(0) === '@') {
      addError('handle', 'The handle should not start with a leading @.');
    }

    if (attrs.location && attrs.location.length > this.max.locationLength) {
      addError('location', app.polyglot.t('profileModelErrors.locationTooLong'));
    }

    if (typeof attrs.vendor !== 'boolean') {
      // this error should never be visible to the user
      addError('vendor', `The vendor value is not a boolean: ${attrs.vendor}`);
    }

    if (typeof attrs.shortDescription !== 'string') {
      addError('shortDescription', 'The shortDescription must be provided as a string.');
    } else if (attrs.shortDescription > this.max.shortDescriptionLength) {
      addError('shortDescription',
        app.polyglot.t('profileModelErrors.shortDescriptionTooLong',
          { count: this.max.shortDescriptionLength }));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  // Ensure any colors are strings and have a leading hash.
  standardizeColorFields(attrs = {}) {
    const updatedAttrs = { ...attrs };

    Object.keys(attrs).forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = updatedAttrs[field].toString();
        updatedAttrs[field] = updatedAttrs[field].charAt(0) !== '#' ?
          `#${updatedAttrs[field]}` : updatedAttrs[field];
      }
    });

    return updatedAttrs;
  }

  parse(resp) {
    const response = { ...resp };

    if (response.moderatorInfo && response.moderatorInfo.fee &&
      response.moderatorInfo.fee.fixedFee) {
      const amount = response.moderatorInfo.fee.fixedFee.amount;
      const isBtc = response.moderatorInfo.fee.fixedFee.currencyCode === 'BTC';

      response.moderatorInfo.fee.fixedFee.amount = integerToDecimal(amount, isBtc);
    }

    if (response.handle && response.handle.startsWith('@')) {
      response.handle = response.handle.slice(1);
    }

    if (response.colors) {
      response.colors = this.standardizeColorFields(response.colors);
    }

    if (response.avatarHashes === null) {
      delete response.avatarHashes;
    }

    if (response.headerHashes === null) {
      delete response.headerHashes;
    }

    return response;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    // ensure certain fields that shouldn't be updated don't go
    // to the server
    if (method !== 'read') {
      delete options.attrs.lastModified;

      if (options.attrs.stats) {
        delete options.attrs.stats.followerCount;
        delete options.attrs.stats.followingCount;
        delete options.attrs.stats.listingCount;
        delete options.attrs.stats.ratingCount;
        delete options.attrs.stats.averageRating;
      }

      const images = [options.attrs.avatarHashes, options.attrs.headerHashes];
      images.forEach(imageHashes => {
        if (typeof imageHashes === 'object') {
          // If the image models are still in their default state (all images hashes as empty
          // strings), we won't send over the image to the server, since it will fail validation.
          if (Object.keys(imageHashes).filter(key => imageHashes[key] === '').length ===
            Object.keys(imageHashes).length) {
            if (imageHashes === options.attrs.avatarHashes) {
              delete options.attrs.avatarHashes;
            } else {
              delete options.attrs.headerHashes;
            }
          }
        }
      });

      if (method !== 'delete') {
        // convert the amount field
        if (options.attrs.moderatorInfo && options.attrs.moderatorInfo.fee &&
          options.attrs.moderatorInfo.fee.fixedFee &&
          options.attrs.moderatorInfo.fee.fixedFee.amount) {
          const amount = options.attrs.moderatorInfo.fee.fixedFee.amount;
          const isBTC = options.attrs.moderatorInfo.fee.fixedFee.currencyCode === 'BTC';
          options.attrs.moderatorInfo.fee.fixedFee.amount = decimalToInteger(amount, isBTC);
        }
      }
    }

    if (method !== 'create' && !this.get('peerID')) {
      throw new Error('I am unable to fetch, save or delete because the model does not' +
        ' have a peerID set.');
    }

    return super.sync(method, model, options);
  }
}

const maxCachedProfiles = 500;
const profileCacheExpires = 1000 * 60 * 60;
const profileCache = new Map();
let profileCacheExpiredInterval;

function expireCachedProfile(peerId) {
  if (!peerId) {
    throw new Error('Please provide a peerId');
  }

  const cached = profileCache.get(peerId);

  if (cached) {
    cached.deferred.reject({
      errCode: 'TIMED_OUT',
      error: 'The profile fetch timeed out.',
    });
  }

  profileCache.delete(peerId);
}

/**
 * This function will fetch a list of profiles via the profiles api utilizing
 * the async and usecache flags. It will return a list of promises that will
 * each resolve when their respective profile arrives via socket.
 * @param {Array} peerIds List of peerId for whose profiles to fetch.
 * @returns {Array} An array of promises corresponding to the array of passed
 * in peerIds. Each promise will resolve when it's respective profile is received
 * via the socket. A profile model will be passed in the resolve handler.
 */
export function getCachedProfiles(peerIds = []) {
  if (!(Array.isArray(peerIds))) {
    throw new Error('Please provide a list of peerIds.');
  }

  if (!peerIds.length) {
    throw new Error('Please provide at least one peerId.');
  }

  peerIds.forEach(id => {
    if (typeof id !== 'string') {
      throw new Error('One or more of the provided peerIds are not strings.');
    }
  });

  const promises = [];
  const profilesToFetch = [];
  let socket;

  if (!profileCacheExpiredInterval) {
    // Check every few minutes and clean up any expired cached profiles
    profileCacheExpiredInterval = setInterval(() => {
      profileCache.forEach((cached, key) => {
        if (Date.now() - cached.createdAt >= profileCacheExpires) {
          expireCachedProfile(key);
        }
      });
    }, 1000 * 60 * 5);
  }

  peerIds.forEach(id => {
    let cached = profileCache.get(id);

    // make sure it's not expired
    if (cached && Date.now() - cached.createdAt >= profileCacheExpires) {
      expireCachedProfile(id);
      cached = null;
    }

    if (!cached) {
      // if cache is full, remove the oldest entry to make room for the new one
      const keys = Array.from(profileCache.keys());
      if (keys.length >= maxCachedProfiles) {
        const cachedItemToRemove = profileCache.get(keys[0]);
        // The deferred has almost certainly long been resolved, but just in case
        // it's still pending, we'll reject it.
        cachedItemToRemove.deferred.reject({
          errCode: 'CACHE_FULL',
          error: 'Entry removed because cache was full.',
        });
        profileCache.delete(keys[0]);
      }

      const deferred = $.Deferred();
      profileCache.set(id, {
        deferred,
        createdAt: Date.now(),
      });
      profilesToFetch.push(id);
    }

    const promise = profileCache.get(id).deferred.promise();

    promise.fail(() => {
      // If the promise fails for any reason, remove it from the cache.
      profileCache.delete(id);
    });

    promises.push(promise);
  });

  if (profilesToFetch.length) {
    $.post({
      url: app.getServerUrl('ob/fetchprofiles?async=true&usecache=true'),
      data: JSON.stringify(profilesToFetch),
      dataType: 'json',
      contentType: 'application/json',
    }).done(() => {
      socket = getSocket();

      if (!socket) {
        promises.forEach(promise => {
          promise.reject({
            errCode: 'NO_SERVER_CONNECTION',
            error: 'There is no server connection.',
          });
        });

        return;
      }

      const onSocketMessage = e => {
        if (!(e.jsonData.peerId && (e.jsonData.profile || e.jsonData.error))) return;

        if (profileCache.get(e.jsonData.peerId)) {
          if (e.jsonData.error) {
            profileCache.get(e.jsonData.peerId)
              .deferred
              .reject({
                errCode: 'SERVER_ERROR',
                error: e.jsonData.error,
              });
          } else {
            profileCache.get(e.jsonData.peerId)
              .deferred
              .resolve(new Profile(e.jsonData.profile, { parse: true }));
          }
        }
      };

      socket.on('message', onSocketMessage);
    })
      .fail(jqXhr => {
        promises.forEach(promise => {
          promise.reject({
            errCode: 'SERVER_ERROR',
            error: jqXhr.responseJSON && jqXhr.responseJSON.reason || '',
          });
        });
      });
  }

  return promises;
}
