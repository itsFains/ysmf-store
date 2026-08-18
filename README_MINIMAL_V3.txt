YSMF MINIMAL PAGE — V3
======================

THIS VERSION FIXES
1. Footer logo / footer brand being too large.
2. Instagram/social icon enlargement.
3. Collection images not appearing reliably.
4. Adds six square preview product cards while Fourthwall products are private.

COPY THESE INTO YOUR EXISTING WEBSITE
- minimal.html
- assets/styles.css
- all 8 supplied Minimal image assets

DO NOT REPLACE
- assets/config.js
- assets/app.js
- assets/minimal-campaign.png
- assets/if-logo.png

YOUR CURRENT HERO BANNER IS STILL USED
The page still uses:
assets/minimal-campaign.png
for the existing hero at the top.

PRIVATE PREVIEW
minimal.html?preview=1

FOR NOW KEEP:
showMinimalInNavigation: false
showMinimalTeaserOnHome: false
minimalIsLive: false

WHAT YOU WILL SEE IN PRIVATE PREVIEW
- current hero banner
- two large collection photographs
- six square product preview cards

The Fourthwall live-product section is hidden while minimalIsLive is false.

LAUNCH DAY
When Fourthwall Minimal is public, set:
showMinimalInNavigation: true
showMinimalTeaserOnHome: true
minimalIsLive: true

At that point:
- the six static preview cards hide
- the real Fourthwall product grid appears

If an image still does not appear after copying:
1. Check the file exists inside /assets in GitHub Desktop.
2. Commit and Push Origin.
3. Wait for GitHub Pages.
4. Ctrl+F5.
5. Remember GitHub Pages file names are case-sensitive.
