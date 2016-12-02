// Temporary module to create some dummy listings data.
// This is a quirky jerky work in progress, use at own risk.
//
// The main function is, which is temporailty exposed on the
// window is:
// window.createDummyListings(count = 300)
//
// Which is used to bulk create listings. However, the server is
// kicking off a publish on each listing created and if you send
// too many, your computer might explode (my cpu somehow reached
// 600% + when I called it with 150). So, I recommend you call
// it with 5 listings and then not call again until publishing
// has completed.

import $ from 'jquery';
import app from '../app';
import { capitalize } from '../utils/string';
import Listing from '../models/listing/Listing';

const imageSizes = [
  {
    width: 1024,
    height: 768,
  },
  {
    width: 1600,
    height: 1200,
  },
  {
    width: 1920,
    height: 1200,
  },
];

function getRandomBase64Img(callback) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Please provide a callback function.');
  }

  // lets randomly select an image size
  const imageSize = imageSizes[Math.floor(Math.random() * imageSizes.length)];
  const img = new Image();

  img.crossOrigin = 'Anonymous';

  img.onload = () => {
    const canvas = document.createElement('CANVAS');
    const ctx = canvas.getContext('2d');

    canvas.height = imageSize.height;
    canvas.width = imageSize.width;
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL('image/jpeg');
    callback(false, dataURL.replace('data:image/jpeg;base64,', ''));
  };

  img.onerror = () => (callback(true));
  img.src = `http://lorempixel.com/${imageSize.width}/${imageSize.height}/?moo=${Date.now() + Math.floor(Math.random() * 100)}`;
}

const categories = [
  'sugar',
  'spice',
  'something nice',
  'chowda',
  'billy goats',
  'filberts',
  'hippos',
  'left-eyed',
  'bearded',
  'morose',
  'straight edge',
  'you name it',
];

const tags = [
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'zeta',
  'eta',
  'theta',
  'iota',
  'kappa',
  'lambda',
  'mu',
];

const titleAdverbs = [
  'extremely',
  'very',
  'greatly',
  'somewhat',
  'quite',
  'slightly',
  'hardly',
  'willfully',
  'wearily',
  'delicately',
  'firmly',
  'financially',
  'beautifully',
  'uneasily',
  'weirdly',
  'cheerfully',
  'lightly',
  'delightfully',
];

const titleAdjectives = [
  'happy',
  'sad',
  'feisty',
  'hippity',
  'bloomin',
  'mercurial',
  'saucy',
  'obnoxious',
  'smitten',
  'driven',
  'bland',
  'fruity',
  'pickled',
  'tangy',
  'fuzzy',
  'slimy',
  'azure',
  'shrill',
  'muffled',
  'melodic',
  'cylindrical',
  'globular',
  'rotund',
  'futuristic',
  'plentiful',
  'abrasive',
];

const titleNouns = [
  'cow',
  'hippo',
  'trooper',
  'salamander',
  'pimple',
  'marsupial',
  'governor',
  'hipster',
  'pimpster',
  'sneaker',
  'vagabond',
  'kitten',
  'pupster',
  'army',
  'regiment',
  'jellyfish',
  'troupe',
  'bodyguard',
  'father-in-law',
  'choir',
  'suitcase',
  'xylophone',
  'panther',
  'bird',
];

function generateTitle() {
  // intentionally the index might be greater than the length by 1, which
  // means we'll skip the adverb
  const adverbIndex = Math.floor(Math.random() * (titleAdverbs.length + 1));
  const adverb = titleAdverbs[adverbIndex] || '';
  const adjIndex = Math.floor(Math.random() * titleAdjectives.length);
  const adj = titleAdjectives[adjIndex];
  const nounIndex = Math.floor(Math.random() * titleNouns.length);
  const noun = titleNouns[nounIndex];

  return capitalize(`${adverb ? `${adverb} ` : ''}${adj} ${noun}`);
}

function createListing(callback, images) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Please provide a callback function.');
  }

  if (!images || !images.length) {
    throw new Error('Please provide an array of base64 images.');
  }

  const catCount = Math.floor(Math.random() * 4);
  const cats = [];

  for (let i = 0; i < catCount; i++) {
    const index = Math.floor(Math.random() * categories.length);
    cats.push(categories[index]);
  }

  const tagCount = Math.floor(Math.random() * 4);
  const listingTags = [];

  for (let i = 0; i < tagCount; i++) {
    const index = Math.floor(Math.random() * tags.length);
    listingTags.push(tags[index]);
  }

  const price = Math.random() * 40000;
  const offersFreeShipping = Math.floor(Math.random() * 2);

  const shippingOptions = [
    {
      name: 'Domestic Shipping',
      type: 'FIXED_PRICE',
      regions: [
        'UNITED_STATES',
      ],
      services: [
        {
          name: 'Standard',
          price: 10,
          estimatedDelivery: '4-6 days',
        },
        {
          name: 'Express',
          price: 18,
          estimatedDelivery: '1-3 days',
        },
      ],
    },
    {
      name: 'International Shipping',
      type: 'FIXED_PRICE',
      regions: [
      // Client doesn't support regions at this point, so for now, we'll
      // add a few random countries
        'CHINA',
        'ALGERIA',
        'AUSTRIA',
      ],
      services: [
        {
          name: 'Standard',
          price: 15,
          estimatedDelivery: '4-6 days',
        },
        {
          name: 'Express',
          price: 30,
          estimatedDelivery: '1-3 days',
        },
      ],
    },
  ];

  if (offersFreeShipping) {
    shippingOptions[0].services[0].price = 0;
  }

  const listing = new Listing({
    listing: {
      item: {
        categories: cats,
        images,
        price,
        tags: listingTags,
        title: generateTitle(),
      },
      shippingOptions,
      metadata: {
        pricingCurrency: 'USD',
      },
    },
  });

  callback(listing.save(), listing);
}

export function createDummyListings(count = 300) {
  for (let i = 0; i < count; i++) {
    // first we'll get between 1 and 3 images to use for our listing
    const imageCount = Math.floor(Math.random() * 3) + 1;
    // console.log(`gonna create ${imageCount} images`);
    const images = [];
    let loaded = 0;

    const onImageCreated = (error, base64) => {
      loaded += 1;

      // console.log(`image created: ${loaded}`);

      if (!error) {
        images.push(base64);
      }

      if (loaded === imageCount) {
        if (images.length) {
          const imgData = images.map(b64Image => ({
            filename: `${Date.now()}.jpg`,
            image: b64Image,
          }));

          $.ajax({
            url: app.getServerUrl('ob/images'),
            type: 'POST',
            data: JSON.stringify(imgData),
            dataType: 'json',
            contentType: 'application/json',
          }).done(uploadedImages => {
            const imageHashes = uploadedImages.map(image => ({
              filename: image.filename,
              original: image.hashes.original,
              large: image.hashes.large,
              medium: image.hashes.medium,
              small: image.hashes.small,
              tiny: image.hashes.tiny,
            }));

            createListing((listingSave, listing) => {
              if (!listingSave) {
                console.warn('Unable to create listing:');
                // window.listing = listing;
                // console.log(listing.validationError);
              } else {
                listingSave.done(() => {
                  console.log(`Listing ${listing.get('listing').get('slug')} created.`);
                }).fail((xhr) => {
                  const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
                  console.warn(`Unable to create listing${failReason ? ` ${failReason}.` : '.'}`);
                });
              }
            }, imageHashes);
          });
        } else {
          console.warn('Unable to create a listing because we were unable to' +
            ' create at least one image for it.');
        }
      }
    };

    for (let j = 0; j < imageCount; j++) {
      getRandomBase64Img(onImageCreated);
    }
  }
}

// temporarily exposing temporary bulk listing creation function
window.createDummyListings = createDummyListings;
