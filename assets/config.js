// ============================================
// YSMF / itsFains storefront configuration
// ============================================
//
// IMPORTANT:
// Use a FOURTHWALL STOREFRONT TOKEN here — NOT your Open API username/password.
// Fourthwall: Settings > For Developers > Storefront token.
//
// Storefront tokens are intended for storefront requests.
// Open API credentials are sensitive and must never be placed in browser code.

window.STORE_CONFIG = {
  brandName: "YSMF",
  creatorName: "itsFains",

  fourthwallShopUrl: "https://itsfains-shop.fourthwall.com",
  storefrontToken: "ptkn_f25f1eeb-08dd-4b3a-ab9e-05e85058972e",

  // Change these after checking the collection URL/slug in Fourthwall.
  signatureCollectionSlug: "signature-collection",
  minimalCollectionSlug: "ysmf-minimal",

  defaultCurrency: "GBP",

  // PRE-LAUNCH SWITCHES
  // Keep false while YSMF Minimal is unreleased.
  showMinimalInNavigation: false,
  showMinimalTeaserOnHome: false,
  minimalIsLive: false,

  socials: {
    twitch: "https://www.twitch.tv/itsFains",
    instagram: "https://www.instagram.com/"
  }
};
