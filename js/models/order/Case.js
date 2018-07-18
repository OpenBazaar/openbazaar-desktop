import { integerToDecimal } from '../../utils/currency';
import BaseOrder from './BaseOrder';
import Contract from './Contract';
import app from '../../app';

export default class extends BaseOrder {
  url() {
    return app.getServerUrl(`ob/case/${this.id}`);
  }

  get idAttribute() {
    return 'caseId';
  }

  get nested() {
    return {
      vendorContract: Contract,
      buyerContract: Contract,
    };
  }

  /**
   * Returns the contract of the party that opened the dispute, which is the only
   * contract you're guaranteed to have. If you need the specific contract of either
   * the buyer or seller, grab it directly via model.get('buyerContract') /
   * model.get('vendorContract').
   */
  get contract() {
    return this.get('buyerOpened') ?
      this.get('buyerContract') : this.get('vendorContract');
  }

  /**
   * Returns a boolean indicating whether the vendor had an error when processing
   * the order. Since this relies on data from the buyers contract, if the contract is
   * not verified as authentic, false will be returned even if the data suggests
   * otherwise. We don't want to prevent funds from being awared to the vendor based
   * on potentially forged data from the buyer's contract.
   */
  get vendorProcessingError() {
    const contract = this.get('buyerContract');
    const contractErrors = this.get('buyerContractValidationErrors');
    return !!contract &&
      Array.isArray(contract.get('errors')) &&
      (
        !contractErrors ||
        !(Array.isArray(contractErrors) && contractErrors.length)
      );
  }

  /**
   * - If the contract hasn't arrived, using this logic, it will be considered invalid.
   * - If the vendor had an error processing the order and the buyer's contract is verified
   *   as authentic, the vendor's contract will be considered valid even though it will not
   *   be sent over, since the mod will only be allowed to send the funds to the buyer.
   */
  isContractValid(buyer = true) {
    const hasContractArrived = buyer ?
      !!this.get('buyerContract') :
      !!this.get('vendorContract');
    const errors = buyer ?
      this.get('buyerContractValidationErrors') :
      this.get('vendorContractValidationErrors');

    return hasContractArrived &&
      (!errors ||
        (Array.isArray(errors) && !errors.length)) ||
      !buyer && this.vendorProcessingError;
  }

  get isBuyerContractValid() {
    return this.isContractValid();
  }

  get isVendorContractValid() {
    return this.isContractValid(false);
  }

  get bothContractsValid() {
    return this.isBuyerContractValid && this.isVendorContractValid;
  }

  get isOrderCancelable() {
    return false;
  }

  get isOrderDisputable() {
    return false;
  }

  convertCryptoQuantity(contract = {}) {
    contract.buyerOrder.items.forEach((item, index) => {
      const listing = contract.vendorListings[index];

      if (listing.metadata.contractType === 'CRYPTOCURRENCY') {
        const coinDivisibility = listing.metadata
          .coinDivisibility;

        item.quantity = item.quantity / coinDivisibility;
      }
    });

    return contract;
  }

  parse(response = {}) {
    response = JSON.parse('{"timestamp":"2018-07-17T19:24:08.000Z","vendorContract":{"vendorListings":[{"slug":"cialis-20mg-generic-tadafil-x10-sealed-pharm-ed-meds-beats-viag","vendorID":{"peerID":"QmX9VGTz2HziSqL7kjNSGjPe8UHDrdyyxZwXyQbBgTbWcN","handle":"","pubkeys":{"identity":"CAESIADHO8wjc1s8Tovxr9iwrBkiPrOZW9ZYFCgVjs8dw5Od","bitcoin":"AlRXfHYmBM2OlRBESnMyKXR3Uspxktj/0prvWjJedFt3"},"bitcoinSig":"MEUCIQCvgiqx+sBZYYimFUqgL6Hey7f8//ILm+l/mA4mWuCZigIgHXA/0BHy/y4WAOIX/itt9/CAxeJsy6u9i6Qd2XcyiW4="},"metadata":{"version":2,"contractType":"PHYSICAL_GOOD","format":"FIXED_PRICE","expiry":"2037-12-31T05:00:00.000Z","acceptedCurrencies":["BTC"],"pricingCurrency":"USD","language":"","escrowTimeoutHours":1080,"coinType":"","coinDivisibility":0},"item":{"title":"Cialis 20MG (Generic) Tadafil x10 Sealed Pharm ED Meds Beats Viagra","description":"Listing is for one sealed blister pack of Generic CIALIS, containing 10 pills, each 20mg of Tadafil. Price includes shipping.Â ","processingTime":"","price":2000,"nsfw":false,"tags":["viagra","cialis","tadafil","ed","erectile-disfunction"],"images":[{"filename":"2018-04-05 14.45.35.jpg","original":"zdj7WfQHmGnWYSVpa8XgqhPmbfKW527z98Fa6j2ADNTzYedGk","large":"zb2rhXJecXzXHTk4oSS2EfB4vLqDbKiJsay87cPtRkmV1Kycd","medium":"zb2rhnpEj9H4TeLQPYnZv59gZ1iTy77NDC73tr2UdZmvuX4hk","small":"zb2rhnxseBmoFYBeTJ2ezF6s5aehFyT1mED4CSfKwPRLfqg9L","tiny":"zb2rhb11NFyh2swPvhbHu7DPFY6875aPw4be4sv8YdoKbTn24"},{"filename":"2018-04-05 14.45.53.jpg","original":"zdj7WaRonjXH9yuLJoGogmdfzzzPg6cZ4MgBPoWtFAzpjZ8J7","large":"zb2rhjkLe8esCKRWcDvN2ya79K2QxP6VBeSf3YxPMUfdJ3tRh","medium":"zb2rha1V1jgfNqCs1AD1Gv6Ds4TZgK9jGycAk99Fr1xiVpA54","small":"zb2rhagT8MgmVQpnWRD1RybCt131rGUmd2DNQZiyAgjLvmHdL","tiny":"zb2rhidVa86eneoPgSDhwgz6VJz3oBaAAkDrDyAue3TwXNr1P"}],"categories":["Misc"],"grams":0,"condition":"NEW","skus":[{"productID":"","surcharge":0,"quantity":0}]},"shippingOptions":[{"name":"Free US Shipping","type":"FIXED_PRICE","regions":["UNITED_STATES"],"services":[{"name":"USPS Trackable","price":0,"estimatedDelivery":"3-5 Days","additionalItemPrice":0}]},{"name":"USPS Priority 2 Day","type":"FIXED_PRICE","regions":["UNITED_STATES"],"services":[{"name":"USPS Priority 2 Day","price":800,"estimatedDelivery":"1-3 Days","additionalItemPrice":0}]}],"moderators":["QmXfMXUzwvbFbeMKz51upAZw9qtdKubv4ByoaHUzEu31Da","QmYET6geiPcchDFR79bAGsTBrBMqULQwR8NctJh9mAT3Kh","QmSF43dbyGZVZqq5oPB58HBmwHX6dB54QgVKxw6A2NEQTH","Qmeh5qqTAjrGyypnXdM4bgF7w4AwYpTG2rQ4kkXhv5bMLG","QmRq8zwc7U9oVY22H9GSWyXZ8ehYge4Ube1k4ABTqAMMHN","QmRYdoZCvUYKcJz1uxv4hZqMWBYpLaXAFuSR5wPjmyYtXL","QmeYJsDbHh2tSwcWyAqHrY5oesnm4hyaqNcntmDAjc8kCT","QmTLCMhBpHtvYhC7Umr4JGgk3SEPwDdEjDpBE89fgiG66L","QmQQwKcrfyoqnZ2YDUXVxg8UsZsG4pev9EALZv1ZbVcA59","QmduBPTQNaXYWivhjNEs8fx5psgazDpH4x1DJqtTcVXhPs","QmeSyTRaNZMD8ajcfbhC8eYibWgnSZtSGUp3Vn59bCnPWC"],"termsAndConditions":"All physical items are guaranteed door to door. This means I will guarantee they leave here and arrive at the shipping destination in exactly the condition shown and described. I will always ship with tracking and if a package&#39;s tracking number ever shows it as lost or missing I will provide a refund. Once a tracking number shows a package has been delivered, I will not entertain any claims of &#34;I know the tracking number SAYS delivered but I really didnt get it&#34;. when it is marked delivered by the shipping carrier, it is delivered.   It is the responsibility and obligation of every buyer to assure that the item(s) purchased are legal to receive, possess and if applicable, use, in their area of residence. We take great pains to assure that everything we sell is legal to sell and ship in our own municipality, and we ask that buyers exercise due diligence and do the same.  ","refundPolicy":"No returns"}],"buyerOrder":{"refundAddress":"14KbCWFejyYKG7oAPUJWDLLhBvBqEazNwv","refundFee":3,"shipping":{"shipTo":"rory cory","address":"5321 abbottswood drive ","city":"smyrna","state":"tn","postalCode":"37167","country":"UNITED_STATES","addressNotes":""},"buyerID":{"peerID":"QmNddVYiJt3o8qHozPDMDu8kq1p1JPAS2b5sz2teMZLkY5","handle":"","pubkeys":{"identity":"CAESII5ECQHz8ImzErG3HBTnltljuCuSCfZqAoM2Hpjcvfsp","bitcoin":"A/dfIYJvBGxH5f05MCVSltrt+tIWfBVfLahUQdryF5An"},"bitcoinSig":"MEUCIQCVl0rtARsd4P1WoO8gEUukUEvzAzF0vn0dxJ2KSKgXJQIgGZFNWyDWJWPPFwu6SmN3ck494hoDHoztxnj2GfKDbHE="},"timestamp":"2018-06-01T21:12:06.799136Z","items":[{"listingHash":"zb2rhcZeHaERgM1dNNr2QGef2vdraej2PkJcxR41xSdLjaqfv","quantity":1,"quantity64":0,"shippingOption":{"name":"Free US Shipping","service":"USPS Trackable"},"memo":"no signature required, leave at front door","paymentAddress":""}],"payment":{"method":"MODERATED","moderator":"QmeSyTRaNZMD8ajcfbhC8eYibWgnSZtSGUp3Vn59bCnPWC","amount":268440,"chaincode":"0c7c42ab2f9b59317ceb5068c287fb24cd7e696a2450391fdce8246d0df0295c","address":"bc1qreg829xkjf26hy2q67hn5m34xx7kz03aupnjt8hdwcxuqfedchfq60hqxw","redeemScript":"63522102d6d95ddefad48b1392c4c21f4a899125ca196a32e61c4bbeb7d247053632b43f2102df5a861804fda1232885ea6da61bd1b3953ec517a5166fddce28747340a83069210272d403bf7220354041736eec09c775bcd4e32eb0d5c3600fbd40a005258e835e53ae67025019b2752102df5a861804fda1232885ea6da61bd1b3953ec517a5166fddce28747340a83069ac68","moderatorKey":"AnLUA79yIDVAQXNu7AnHdbzU4y6w1cNgD71AoAUljoNe"},"ratingKeys":["A0V1NJHlqJPaH+qiO3RsPuWvAVswh/b5lXZ/gJ2EPIM+"],"alternateContactInfo":"","version":1},"vendorOrderConfirmation":{"orderID":"QmTDpcTdyCYCYxSGB2hMfsVBMvhwXujvxezgWQzbeEZN7E","timestamp":"2018-06-01T21:12:45.731957400Z","paymentAddress":"bc1qreg829xkjf26hy2q67hn5m34xx7kz03aupnjt8hdwcxuqfedchfq60hqxw","requestedAmount":268440,"ratingSignatures":[{"metadata":{"listingSlug":"cialis-20mg-generic-tadafil-x10-sealed-pharm-ed-meds-beats-viag","moderatorKey":"AnLUA79yIDVAQXNu7AnHdbzU4y6w1cNgD71AoAUljoNe","listingTitle":"Cialis 20MG (Generic) Tadafil x10 Sealed Pharm ED Meds Beats Viagra","thumbnail":{"tiny":"zb2rhb11NFyh2swPvhbHu7DPFY6875aPw4be4sv8YdoKbTn24","small":"zb2rhnxseBmoFYBeTJ2ezF6s5aehFyT1mED4CSfKwPRLfqg9L","medium":"zb2rhnpEj9H4TeLQPYnZv59gZ1iTy77NDC73tr2UdZmvuX4hk","large":"zb2rhXJecXzXHTk4oSS2EfB4vLqDbKiJsay87cPtRkmV1Kycd","original":"zdj7WfQHmGnWYSVpa8XgqhPmbfKW527z98Fa6j2ADNTzYedGk"}},"signature":"ROw0IO4oCmPOxkGtuj0o21XTj6/rpuXwSTSxYNGYcUTOLHxZe2tXePXDh65NhKc/KpoUCYCOvMvCYWYl6tTQAQ=="}]},"vendorOrderFulfillment":[{"orderId":"QmTDpcTdyCYCYxSGB2hMfsVBMvhwXujvxezgWQzbeEZN7E","slug":"cialis-20mg-generic-tadafil-x10-sealed-pharm-ed-meds-beats-viag","timestamp":"2018-06-01T21:13:55.060597500Z","physicalDelivery":[{"shipper":"USPS","trackingNumber":""}],"payout":{"sigs":[{"inputIndex":0,"signature":"MEUCIQCGxJwXpUbVxdu8laPPuA/hvmcN9WCXhwKGpS0CG3DGIAIgZUnARSBRrB+eYhMR4T3d6m5fuMHhI38+pXF8TvYs3AQB"}],"payoutAddress":"154RpmS8FEdBJtBQdu52ujPDCk895GqreG","payoutFeePerByte":3},"ratingSignature":{"metadata":{"listingSlug":"cialis-20mg-generic-tadafil-x10-sealed-pharm-ed-meds-beats-viag","ratingKey":"A0V1NJHlqJPaH+qiO3RsPuWvAVswh/b5lXZ/gJ2EPIM+","listingTitle":"Cialis 20MG (Generic) Tadafil x10 Sealed Pharm ED Meds Beats Viagra","thumbnail":{"tiny":"zb2rhb11NFyh2swPvhbHu7DPFY6875aPw4be4sv8YdoKbTn24","small":"zb2rhnxseBmoFYBeTJ2ezF6s5aehFyT1mED4CSfKwPRLfqg9L","medium":"zb2rhnpEj9H4TeLQPYnZv59gZ1iTy77NDC73tr2UdZmvuX4hk","large":"zb2rhXJecXzXHTk4oSS2EfB4vLqDbKiJsay87cPtRkmV1Kycd","original":"zdj7WfQHmGnWYSVpa8XgqhPmbfKW527z98Fa6j2ADNTzYedGk"}},"signature":"CHHsxNIo6gImREAovO/RXxmeiTs+rmfgLsTtLmj2kQKN82Luxl2p0ziDO3vu0plqwwfylcMuwBnraOCCstKADg=="},"note":"Package goes out tomorrow morning, thank you!"}],"signatures":[{"section":"LISTING","signatureBytes":"Zq647hM3d7VuR5KskcXevy9j9o8osXYhWQJrFCTkUYpG66ep5abl0c/7Rk91QUdcvAuMF7WugAm3pFHlyXecCA=="},{"section":"ORDER","signatureBytes":"6pRJ1ZevAlH53wwZKCXNFIzbak0S7OfS/SOGIKcc91+r+Cq10aqaF9N2zR09Hlrh5HqqwNTLX7iJuZIxDe4tAQ=="},{"section":"ORDER_CONFIRMATION","signatureBytes":"kfirEfZybmNp1KieaFMxbVCr9BMwrLeI5yfl3/SNrJXdzGeg+a0YQ0gZsAdeDYYBUmIuV6aDGeVf3PHyhLq1DA=="},{"section":"ORDER_FULFILLMENT","signatureBytes":"JcGHoaYlmSB4IaVnIeDoaSIQC12K60EPZdiGkvu5/VhPltdKG6iPGW5uw/1dPs9eyi+QrVM9OMPY+4BtEjdLBA=="}]},"state":"DISPUTED","read":true,"buyerOpened":false,"claim":"Package was delivered yesterday afternoon, buyer hasnt been back as yet or responded to messages requesting finalization &amp; release of payment. Tracking number is 9505511607668156131736 - since hes my first buyer for physical goods I sent *double* what he ordered.   I figure hes busy or like most of buyers he doesnt know he needs to complete the sale. ","unreadChatMessages":0}');

    // If only one contract has arrived, we'll fire an event when the other one comes
    if (!this._otherContractEventBound &&
      !this.vendorProcessingError &&
      (
        (response.buyerOpened && !response.vendorContract) ||
        (!response.buyerOpened && !response.buyerContract)
      )
    ) {
      const needBuyer = !response.buyerContract;
      this._otherContractEventBound = true;
      this.once(`change:${needBuyer ? 'buyer' : 'vendor'}Contract`,
        () => this.trigger('otherContractArrived', this, { isBuyer: needBuyer }));
    }

    if (response.buyerContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawBuyerContract =
        JSON.parse(JSON.stringify(response.buyerContract)); // deep clone

      // convert price fields
      response.buyerContract.buyerOrder.payment.amount =
        integerToDecimal(response.buyerContract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);

      response.buyerContract = this.convertCryptoQuantity(response.buyerContract);
    }

    if (response.vendorContract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawVendorContract =
        JSON.parse(JSON.stringify(response.vendorContract)); // deep clone

      // convert price fields
      response.vendorContract.buyerOrder.payment.amount =
        integerToDecimal(response.vendorContract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);
    }

    if (response.resolution) {
      response.resolution.payout.buyerOutput =
        response.resolution.payout.buyerOutput || {};
      response.resolution.payout.vendorOutput =
        response.resolution.payout.vendorOutput || {};
      response.resolution.payout.moderatorOutput =
        response.resolution.payout.moderatorOutput || {};

      response.resolution.payout.buyerOutput.amount =
        integerToDecimal(response.resolution.payout.buyerOutput.amount || 0,
          app.serverConfig.cryptoCurrency);
      response.resolution.payout.vendorOutput.amount =
        integerToDecimal(response.resolution.payout.vendorOutput.amount || 0,
          app.serverConfig.cryptoCurrency);
      response.resolution.payout.moderatorOutput.amount =
        integerToDecimal(response.resolution.payout.moderatorOutput.amount || 0,
          app.serverConfig.cryptoCurrency);
    }

    return response;
  }
}
