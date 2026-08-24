# Anup House

One-page static website for Anup House, a family-run guest house in Bodhgaya.

## Run locally

Open `index.html` in a browser, or serve the folder with any static web server.

## Localized pages

Edit the English page in `index.html` and translated strings in `translations.js`, then regenerate the crawlable language pages and sitemap:

```sh
node scripts/generate-localized-pages.mjs
node scripts/check-localized-pages.mjs
```

Each language has its own URL, localized metadata and reciprocal `hreflang` links. Commit the generated language directories and `sitemap.xml` with their source changes.

## Contact details

- WhatsApp / phone: +91 72799 49453
- Email: rajshashi787@gmail.com

## Search indexing

The live site is https://anup-house.pages.dev/. Verify it in Google Search Console and Bing Webmaster Tools, then submit https://anup-house.pages.dev/sitemap.xml.
