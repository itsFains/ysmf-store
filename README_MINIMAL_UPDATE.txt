YSMF MINIMAL — DROP 01 PAGE UPDATE
===================================

WHAT THIS PACKAGE DOES
- Keeps your CURRENT Minimal hero banner unchanged.
- Adds a complete release-ready Minimal page underneath it.
- Adds the motto: "Wear It Like You Mean It."
- Adds two collection/editorial sections.
- Adds a three-image lookbook.
- Keeps the Fourthwall product grid dynamic.
- Keeps the current private-preview / hidden-until-launch behaviour.
- Includes an optional campaign-film section ready for your Gemini website video.

FILES TO COPY INTO YOUR EXISTING YSMF STORE
1. minimal.html
2. assets/styles.css
3. assets/minimal-lookbook-wide.webp
4. assets/minimal-lookbook-grid.webp
5. assets/minimal-hoodie-white-logo.webp
6. assets/minimal-cream-tee.webp

IMPORTANT
- DO NOT overwrite assets/config.js.
- DO NOT overwrite assets/app.js.
- DO NOT delete assets/minimal-campaign.png.
  Your existing hero still uses that file and this update intentionally leaves it alone.
- Keep assets/if-logo.png and all your other existing site files.

PRIVATE PREVIEW
While Minimal is still hidden, open:
minimal.html?preview=1

Keep these settings in assets/config.js for now:
showMinimalInNavigation: false
showMinimalTeaserOnHome: false
minimalIsLive: false

FOURTHWALL
Your product grid is still:
data-collection="minimal"

Before launch, make sure minimalCollectionSlug in assets/config.js matches the actual Fourthwall collection URL slug.

LAUNCH DAY — 18 SEPTEMBER 2026
Once the Fourthwall Minimal collection is public, change:
showMinimalInNavigation: true
showMinimalTeaserOnHome: true
minimalIsLive: true

WEBSITE VIDEO
When your Gemini website campaign film is ready:
- Export it as MP4.
- Rename it exactly:
  minimal-site-film.mp4
- Put it inside:
  assets/minimal-site-film.mp4

The page already contains the campaign-film section.
If the MP4 is missing, that section hides automatically.

GITHUB DESKTOP
1. Copy the files into your existing project.
2. Open GitHub Desktop.
3. Review the changed files.
4. Commit.
5. Push origin.
6. Wait for GitHub Pages to update.
7. Hard refresh with Ctrl+F5.
