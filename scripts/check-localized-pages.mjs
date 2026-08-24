import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const siteUrl = 'https://anup-house.pages.dev';
const locales = [
  ['en', '/', 'en'], ['hi', '/hi/', 'hi'], ['bo', '/bo/', 'bo'], ['ja', '/ja/', 'ja'],
  ['th', '/th/', 'th'], ['vi', '/vi/', 'vi'], ['ko', '/ko/', 'ko'],
  ['zh-CN', '/zh-cn/', 'zh-Hans'], ['zh-TW', '/zh-tw/', 'zh-TW'],
  ['yue-HK', '/yue-hk/', 'zh-HK'], ['my', '/my/', 'my'], ['lo', '/lo/', 'lo']
];

const translationSource = fs.readFileSync(path.join(root, 'translations.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${translationSource.split('const languageSwitcher')[0]};globalThis.__translations = translations;`, context);
const translations = context.__translations;
const english = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredKeys = [...new Set([...english.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]))];
const expectedUrls = locales.map(([, localePath]) => `${siteUrl}${localePath}`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [key, localePath, hreflang] of locales) {
  const file = key === 'en' ? path.join(root, 'index.html') : path.join(root, localePath.slice(1), 'index.html');
  assert(fs.existsSync(file), `${key}: localized page is missing`);
  const html = fs.readFileSync(file, 'utf8');
  const canonical = `${siteUrl}${localePath}`;
  assert(html.includes(`data-language="${key}"`), `${key}: data-language is incorrect`);
  assert(html.includes(`<link rel="canonical" href="${canonical}" />`), `${key}: canonical URL is incorrect`);
  assert(html.includes(`<link rel="alternate" hreflang="${hreflang}" href="${canonical}" />`), `${key}: self hreflang is missing`);
  assert((html.match(/rel="alternate" hreflang=/g) || []).length === locales.length + 1, `${key}: hreflang set is incomplete`);
  assert((html.match(/data-language=/g) || []).length === locales.length + 1, `${key}: language menu is incomplete`);
  assert(html.includes('href="/styles.css"') && html.includes('src="/translations.js"'), `${key}: root assets are not linked safely`);
  assert(/<title>[^<]{8,}<\/title>/.test(html), `${key}: title is missing`);
  assert(/<meta name="description" content="[^"]{30,}" \/>/.test(html), `${key}: meta description is missing`);

  if (key !== 'en') {
    const strings = translations[key];
    const missingKeys = requiredKeys.filter((translationKey) => !strings[translationKey]);
    assert(missingKeys.length === 0, `${key}: missing translations: ${missingKeys.join(', ')}`);
    assert(html.includes(strings.heroTitle), `${key}: hero text was not rendered into HTML`);
    assert(html.includes(strings.welcomeP1), `${key}: body text was not rendered into HTML`);
  }

  console.log(`${key}: page, metadata, menu and hreflang passed`);
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const url of expectedUrls) assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap: missing ${url}`);
assert((sitemap.match(/<url>/g) || []).length === locales.length, 'sitemap: URL count is incorrect');
console.log(`sitemap: ${locales.length} localized URLs passed`);
