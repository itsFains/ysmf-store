# YSMF / itsFains custom storefront — Stage 1

This is a static GitHub Pages-ready storefront.

## What is included

- `index.html` — main homepage
- `shop.html` — all public Fourthwall products
- `signature.html` — Signature collection
- `minimal.html` — YSMF Minimal page, kept out of navigation by default
- `about.html` — brand story
- `404.html` — GitHub Pages fallback
- `assets/config.js` — all storefront settings
- `assets/styles.css` — full design system
- `assets/app.js` — navigation, currency and Fourthwall product loading

## 1. Put it on GitHub

Create a repository, for example:

`ysmf-store`

Upload everything **inside this folder** to the root of the repository.

GitHub Pages needs `index.html` at the top level.

Then:

1. Open the repository.
2. `Settings`
3. `Pages`
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Branch: `main`
6. Folder: `/ (root)`
7. Save.

Your temporary URL will normally be:

`https://YOUR-USERNAME.github.io/ysmf-store/`

All links in this project are relative, so they work on a project GitHub Pages URL as well as a future custom domain.

## 2. Connect Fourthwall products

In Fourthwall:

`Settings > For Developers`

Create/get a **Storefront token**.

DO NOT put Fourthwall Open API usernames/passwords into this website.

Open:

`assets/config.js`

and change:

```js
storefrontToken: "",
```

to:

```js
storefrontToken: "ptkn_your_token_here",
```

The site then fetches public products from Fourthwall's Storefront API.

## 3. Set the real collection slugs

In `assets/config.js`:

```js
signatureCollectionSlug: "signature-collection",
minimalCollectionSlug: "ysmf-minimal",
```

Change these to match the last part of each public Fourthwall collection URL.

## 4. YSMF Minimal stays hidden until launch

These are intentionally `false`:

```js
showMinimalInNavigation: false,
showMinimalTeaserOnHome: false,
minimalIsLive: false,
```

When you want to tease it:

```js
showMinimalTeaserOnHome: true,
```

When you want the page in navigation:

```js
showMinimalInNavigation: true,
```

When the Fourthwall collection/products are public and you want the product grid to load:

```js
minimalIsLive: true,
```

## 5. How page linking works

Normal HTML links:

```html
<a href="shop.html">Shop</a>
<a href="signature.html">Signature</a>
<a href="about.html">About</a>
```

Because every page is at the repository root, links stay simple.

## Stage 2

Next stage can add:

- proper product-detail pages on your custom site
- size / colour selectors
- Fourthwall cart API
- cart drawer
- hosted Fourthwall checkout handoff
- custom YSMF domain
- launch animation / richer interactions
- SEO / Open Graph images
