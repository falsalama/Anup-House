import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const siteUrl = 'https://anup-house.pages.dev';
const locales = [
  { key: 'en', path: '/', hreflang: 'en', htmlLang: 'en', ogLocale: 'en_IN', seoTitle: 'Anup House | Family guest house in Bodhgaya' },
  { key: 'hi', path: '/hi/', hreflang: 'hi', htmlLang: 'hi', ogLocale: 'hi_IN', seoTitle: 'Anup House | बोधगया में पारिवारिक गेस्ट हाउस' },
  { key: 'bo', path: '/bo/', hreflang: 'bo', htmlLang: 'bo', ogLocale: 'bo_IN', seoTitle: 'Anup House | བོད་ག་ཡའི་ཁྱིམ་ཚང་མགྲོན་ཁང་' },
  { key: 'ja', path: '/ja/', hreflang: 'ja', htmlLang: 'ja', ogLocale: 'ja_JP', seoTitle: 'Anup House | ボードガヤの家族経営ゲストハウス' },
  { key: 'th', path: '/th/', hreflang: 'th', htmlLang: 'th', ogLocale: 'th_TH', seoTitle: 'Anup House | เกสต์เฮาส์ครอบครัวในพุทธคยา' },
  { key: 'vi', path: '/vi/', hreflang: 'vi', htmlLang: 'vi', ogLocale: 'vi_VN', seoTitle: 'Anup House | Nhà nghỉ gia đình tại Bodhgaya' },
  { key: 'ko', path: '/ko/', hreflang: 'ko', htmlLang: 'ko', ogLocale: 'ko_KR', seoTitle: 'Anup House | 보드가야 가족 운영 게스트하우스' },
  { key: 'zh-CN', path: '/zh-cn/', hreflang: 'zh-Hans', htmlLang: 'zh-Hans-CN', ogLocale: 'zh_CN', seoTitle: 'Anup House | 菩提迦耶家庭旅馆' },
  { key: 'zh-TW', path: '/zh-tw/', hreflang: 'zh-TW', htmlLang: 'zh-Hant-TW', ogLocale: 'zh_TW', seoTitle: 'Anup House | 菩提迦耶家庭民宿' },
  { key: 'yue-HK', path: '/yue-hk/', hreflang: 'zh-HK', htmlLang: 'yue-Hant-HK', ogLocale: 'zh_HK', seoTitle: 'Anup House | 菩提迦耶家庭賓館' },
  { key: 'my', path: '/my/', hreflang: 'my', htmlLang: 'my', ogLocale: 'my_MM', seoTitle: 'Anup House | ဗုဒ္ဓဂယာ မိသားစုဧည့်ရိပ်သာ' },
  { key: 'lo', path: '/lo/', hreflang: 'lo', htmlLang: 'lo', ogLocale: 'lo_LA', seoTitle: 'Anup House | ເຮືອນພັກຄອບຄົວໃນພຸດທະຄະຍາ' }
];

const translationSource = fs.readFileSync(path.join(root, 'translations.js'), 'utf8');
const translationDataSource = `${translationSource.split('const languageSwitcher')[0]};globalThis.__translations = translations;`;
const context = {};
vm.createContext(context);
vm.runInContext(translationDataSource, context);
const translations = context.__translations;
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const escapeAttribute = (value) => escapeHtml(value).replaceAll('"', '&quot;');
const escapeXml = (value) => escapeAttribute(value).replaceAll("'", '&apos;');

const alternateTags = [
  ...locales.map((locale) => `    <link rel="alternate" hreflang="${locale.hreflang}" href="${siteUrl}${locale.path}" />`),
  `    <link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`
].join('\n');

function replaceMeta(html, selector, value) {
  const escaped = escapeAttribute(value);
  const pattern = new RegExp(`(<meta ${selector} content=")[^"]*(" \\/>)`);
  return html.replace(pattern, `$1${escaped}$2`);
}

function renderPage(locale) {
  const strings = translations[locale.key] || {};
  const pageUrl = `${siteUrl}${locale.path}`;
  const title = locale.seoTitle;
  const description = locale.key === 'en'
    ? 'A welcoming family guest house near Kalachakra Ground in Bodhgaya, Bihar.'
    : strings.heroIntro;
  let html = source;

  html = html.replace(/<html lang="[^"]+"(?: data-language="[^"]+")?>/, `<html lang="${locale.htmlLang}" data-language="${locale.key}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${pageUrl}" />`);
  html = html.replace(/    <!-- hreflang:start -->[\s\S]*?    <!-- hreflang:end -->/, `    <!-- hreflang:start -->\n${alternateTags}\n    <!-- hreflang:end -->`);
  html = replaceMeta(html, 'name="description"', description);
  html = replaceMeta(html, 'property="og:url"', pageUrl);
  html = replaceMeta(html, 'property="og:title"', title);
  html = replaceMeta(html, 'property="og:description"', description);
  html = replaceMeta(html, 'property="og:locale"', locale.ogLocale);
  html = html.replace(/("url": ")[^"]*(",)/, `$1${pageUrl}$2`);
  html = html.replace(/("description": ")[^"]*(",)/, `$1${JSON.stringify(description).slice(1, -1)}$2`);

  if (locale.key !== 'en') {
    html = html.replace(/(<([a-z][a-z0-9]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/gi, (match, open, tag, key, text, close) => {
      return strings[key] ? `${open}${escapeHtml(strings[key])}${close}` : match;
    });
  }

  html = html
    .replaceAll('href="assets/', 'href="/assets/')
    .replaceAll('src="assets/', 'src="/assets/')
    .replace('href="styles.css"', 'href="/styles.css"')
    .replace('src="translations.js"', 'src="/translations.js"');

  return html;
}

for (const locale of locales) {
  const outputPath = locale.key === 'en'
    ? path.join(root, 'index.html')
    : path.join(root, locale.path.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPage(locale));
}

const lastModified = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...locales.map((locale) => [
    '  <url>',
    `    <loc>${escapeXml(`${siteUrl}${locale.path}`)}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    '    <changefreq>monthly</changefreq>',
    `    <priority>${locale.key === 'en' ? '1.0' : '0.8'}</priority>`,
    '  </url>'
  ].join('\n')),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

console.log(`Generated ${locales.length} localized pages and sitemap.xml`);
