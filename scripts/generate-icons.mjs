/**
 * Generates the MindForAI brand assets (app icon candidates + wordmark).
 *
 *   node scripts/generate-icons.mjs            regenerate every candidate
 *   node scripts/generate-icons.mjs 07-flow    make 07-flow the active icon
 *
 * Output:
 *   apps/web/public/logo/icons/icon-01..10-*.svg  candidate app icons
 *   apps/web/public/logo/icons/index.html         preview gallery
 *   apps/web/public/favicon.svg                   the active icon
 *   apps/web/public/logo/logo_mindforai_h*.svg    horizontal wordmark
 *
 * The raster fallbacks (favicon.ico, apple-touch-icon.png) are checked in as
 * build artifacts; see docs/brand.md for how to refresh them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public');
const LOGO_DIR = path.join(PUBLIC_DIR, 'logo');
const ICON_DIR = path.join(LOGO_DIR, 'icons');

const BRAND = ['#1ea9ef', '#6852f2', '#ab56d9', '#f160b5', '#ef8861'];
const CANVAS = 512;
const BADGE_RADIUS = 112;

/** The icon currently used as the active favicon. */
const DEFAULT_ICON = '01-mindmap';

const gradientDefs = (id = 'brand') => {
  const stops = BRAND.map(
    (color, index) =>
      `      <stop offset="${(index / (BRAND.length - 1)).toFixed(4)}" stop-color="${color}"/>`
  ).join('\n');
  return `  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
${stops}
    </linearGradient>
  </defs>`;
};

const badge = (id = 'brand') =>
  `  <rect width="${CANVAS}" height="${CANVAS}" rx="${BADGE_RADIUS}" fill="url(#${id})"/>`;

const glyphMindmap = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="20" stroke-linecap="round">
    <path d="M256 256 L140 140"/>
    <path d="M256 256 L372 140"/>
    <path d="M256 256 L140 372"/>
    <path d="M256 256 L372 372"/>
  </g>
  <g fill="${paint}">
    <circle cx="256" cy="256" r="58"/>
    <circle cx="140" cy="140" r="32"/>
    <circle cx="372" cy="140" r="32"/>
    <circle cx="140" cy="372" r="32"/>
    <circle cx="372" cy="372" r="32"/>
  </g>`;

const glyphDocument = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round">
    <path d="M160 104 h136 l64 64 v240 a16 16 0 0 1 -16 16 h-184 a16 16 0 0 1 -16 -16 v-288 a16 16 0 0 1 16 -16 z"/>
    <path d="M296 104 v64 h64"/>
    <path d="M252 296 v-56"/>
    <path d="M252 240 h-48 v-40"/>
    <path d="M252 240 h48 v-40"/>
  </g>
  <g fill="${paint}">
    <circle cx="252" cy="296" r="22"/>
    <circle cx="204" cy="200" r="17"/>
    <circle cx="300" cy="200" r="17"/>
  </g>`;

const glyphChat = (paint) => `
  <path fill="${paint}" d="M128 132 a44 44 0 0 1 44 -44 h168 a44 44 0 0 1 44 44 v132 a44 44 0 0 1 -44 44 h-96 l-72 66 v-66 h-44 a44 44 0 0 1 -44 -44 z"/>
  <g fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round">
    <path d="M256 216 v46"/>
    <path d="M256 240 h-46 v-34"/>
    <path d="M256 240 h46 v-34"/>
  </g>
  <g fill="#ffffff">
    <circle cx="256" cy="200" r="22"/>
    <circle cx="210" cy="206" r="15"/>
    <circle cx="302" cy="206" r="15"/>
  </g>`;

const glyphTerminal = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <rect x="104" y="132" width="304" height="248" rx="40"/>
    <path d="M104 200 h304"/>
    <path d="M160 268 l52 44 l-52 44"/>
    <path d="M244 356 h92"/>
  </g>
  <g fill="${paint}">
    <circle cx="146" cy="166" r="11"/>
    <circle cx="180" cy="166" r="11"/>
    <circle cx="214" cy="166" r="11"/>
  </g>`;

const glyphNetwork = (paint) => {
  const left = [
    [148, 176],
    [148, 336],
  ];
  const middle = [
    [256, 136],
    [256, 256],
    [256, 376],
  ];
  const right = [
    [364, 176],
    [364, 336],
  ];
  const edges = [];
  for (const [x1, y1] of left) {
    for (const [x2, y2] of middle) {
      edges.push(`    <path d="M${x1} ${y1} L${x2} ${y2}"/>`);
    }
  }
  for (const [x1, y1] of middle) {
    for (const [x2, y2] of right) {
      edges.push(`    <path d="M${x1} ${y1} L${x2} ${y2}"/>`);
    }
  }
  const nodes = [
    [148, 176, 30],
    [148, 336, 30],
    [256, 136, 36],
    [256, 256, 36],
    [256, 376, 36],
    [364, 176, 30],
    [364, 336, 30],
  ].map(([x, y, r]) => `    <circle cx="${x}" cy="${y}" r="${r}"/>`);
  return `
  <g fill="none" stroke="${paint}" stroke-width="14" stroke-linecap="round">
${edges.join('\n')}
  </g>
  <g fill="${paint}">
${nodes.join('\n')}
  </g>`;
};

const glyphSparkle = (paint) => `
  <g fill="${paint}">
    <path d="M330 118 c14 58 40 84 98 98 c-58 14 -84 40 -98 98 c-14 -58 -40 -84 -98 -98 c58 -14 84 -40 98 -98 z"/>
  </g>
  <g fill="none" stroke="${paint}" stroke-width="20" stroke-linecap="round">
    <path d="M186 262 v66"/>
    <path d="M186 294 h-48 v-42"/>
    <path d="M186 294 h48 v-42"/>
  </g>
  <g fill="${paint}">
    <circle cx="186" cy="252" r="26"/>
    <circle cx="138" cy="252" r="18"/>
    <circle cx="234" cy="252" r="18"/>
  </g>`;

const glyphFlow = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round">
    <path d="M256 108 l72 68 l-72 68 l-72 -68 z"/>
    <path d="M256 244 v60"/>
    <path d="M148 372 h216"/>
    <path d="M196 372 v-34"/>
    <path d="M316 372 v-34"/>
    <path d="M256 304 v34"/>
  </g>
  <g fill="${paint}">
    <circle cx="196" cy="330" r="18"/>
    <circle cx="316" cy="330" r="18"/>
    <circle cx="256" cy="330" r="18"/>
  </g>`;

const glyphLayers = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round">
    <path d="M256 104 l148 76 l-148 76 l-148 -76 z"/>
    <path d="M108 236 l148 76 l148 -76"/>
    <path d="M108 296 l148 76 l148 -76"/>
  </g>`;

const glyphBraces = (paint) => `
  <g fill="none" stroke="${paint}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M212 116 c-56 0 -56 60 -56 96 c0 30 -20 44 -44 44 c24 0 44 14 44 44 c0 36 0 96 56 96"/>
    <path d="M300 116 c56 0 56 60 56 96 c0 30 20 44 44 44 c-24 0 -44 14 -44 44 c0 36 0 96 -56 96"/>
  </g>
  <g fill="${paint}">
    <circle cx="256" cy="256" r="34"/>
  </g>`;

const glyphRadial = (paint) => {
  const edges = [];
  const dots = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = ((index * 45 - 90) * Math.PI) / 180;
    const x = 256 + 158 * Math.cos(angle);
    const y = 256 + 158 * Math.sin(angle);
    edges.push(`    <path d="M256 256 L${x.toFixed(1)} ${y.toFixed(1)}"/>`);
    dots.push(`    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22"/>`);
  }
  return `
  <g fill="none" stroke="${paint}" stroke-width="16" stroke-linecap="round">
${edges.join('\n')}
  </g>
  <g fill="${paint}">
    <circle cx="256" cy="256" r="46"/>
${dots.join('\n')}
  </g>`;
};

const ICONS = [
  { slug: '01-mindmap', label: 'Mind Map', glyph: glyphMindmap },
  { slug: '02-document', label: 'Document Tree', glyph: glyphDocument, transform: 'translate(2 4)' },
  { slug: '03-chat', label: 'AI Chat', glyph: glyphChat, transform: 'translate(22 25)' },
  { slug: '04-terminal', label: 'Terminal', glyph: glyphTerminal },
  { slug: '05-network', label: 'Neural Network', glyph: glyphNetwork },
  { slug: '06-sparkle', label: 'AI Sparkle', glyph: glyphSparkle, transform: 'translate(-18 17)' },
  { slug: '07-flow', label: 'Flowchart', glyph: glyphFlow, transform: 'translate(2 16)' },
  { slug: '08-layers', label: 'Layers', glyph: glyphLayers, transform: 'translate(2 20)' },
  { slug: '09-braces', label: 'Code Braces', glyph: glyphBraces },
  { slug: '10-radial', label: 'Radial Map', glyph: glyphRadial },
];

/**
 * The icon used as the active favicon. Override on the command line:
 *   node scripts/generate-icons.mjs 07-flow
 */
const resolveActiveIcon = () => {
  const requested = process.argv[2];
  if (!requested) {
    return ICONS.find((icon) => icon.slug === DEFAULT_ICON) ?? ICONS[0];
  }
  const matched = ICONS.find(
    (icon) => icon.slug === requested || icon.slug.split('-')[0] === requested
  );
  if (!matched) {
    console.error(
      `Unknown icon "${requested}". Available: ${ICONS.map((icon) => icon.slug).join(', ')}`
    );
    process.exit(1);
  }
  return matched;
};

const badgeSvg = (icon) => {
  const glyph = icon.glyph('#ffffff').trim();
  const content = icon.transform ? `<g transform="${icon.transform}">\n${glyph}\n  </g>` : glyph;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img">',
    gradientDefs(),
    badge(),
    content,
    '</svg>',
    '',
  ].join('\n');
};

const wordmarkSvg = (icon, textFill) => {
  const scale = 118 / CANVAS;
  const glyph = icon.glyph('url(#gradient_74)').trim();
  const content = icon.transform ? `<g transform="${icon.transform}">\n${glyph}\n  </g>` : glyph;
  return `<svg id="layer_1" data-name="layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 790 160" width="790" height="160" role="img" aria-label="MindForAI">
  <defs>
    <style>.cls-1{fill:${textFill};}</style>
    <linearGradient id="gradient_74" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND[0]}"/>
      <stop offset="0.27" stop-color="${BRAND[1]}"/>
      <stop offset="0.54" stop-color="${BRAND[2]}"/>
      <stop offset="0.78" stop-color="${BRAND[3]}"/>
      <stop offset="1" stop-color="${BRAND[4]}"/>
    </linearGradient>
  </defs>
  <g transform="translate(18 21) scale(${scale.toFixed(4)})">
${content}
  </g>
  <text class="cls-1" x="155" y="125" font-family="'Helvetica Neue',Helvetica,Arial,'PingFang SC','Microsoft Yahei',sans-serif" font-size="132" font-weight="700" letter-spacing="0" textLength="620" lengthAdjust="spacingAndGlyphs">MindForAI</text>
</svg>
`;
};

const previewHtml = (cards) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MindForAI 图标候选</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif; margin: 0; padding: 40px; background: #f6f7f9; color: #1e1e1e; }
  h1 { font-size: 24px; margin: 0 0 6px; }
  p.hint { color: #666; margin: 0 0 32px; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
  .card { background: #fff; border: 1px solid #e6e8eb; border-radius: 12px; padding: 20px; text-align: center; }
  .card img { width: 96px; height: 96px; display: block; margin: 0 auto 12px; }
  .card .name { font-weight: 600; font-size: 14px; }
  .card .file { color: #888; font-size: 12px; margin-top: 4px; word-break: break-all; }
  .card .sizes { margin-top: 14px; display: flex; gap: 10px; align-items: flex-end; justify-content: center; }
  .card .sizes img { margin: 0; }
</style>
</head>
<body>
<h1>MindForAI 图标候选</h1>
<p class="hint">挑一个编号告诉我即可（例如「用 03」）。当前默认：<strong>${DEFAULT_ICON.split('-')[0]}</strong>。</p>
<div class="grid">
${cards.join('\n')}
</div>
</body>
</html>
`;

const writeFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('wrote', path.relative(ROOT, filePath));
};

const main = () => {
  const cards = [];
  for (const icon of ICONS) {
    writeFile(path.join(ICON_DIR, `icon-${icon.slug}.svg`), badgeSvg(icon));
    cards.push(`  <div class="card">
    <img src="icon-${icon.slug}.svg" alt="${icon.label}" />
    <div class="name">${icon.slug} &middot; ${icon.label}</div>
    <div class="file">icon-${icon.slug}.svg</div>
    <div class="sizes">
      <img src="icon-${icon.slug}.svg" width="32" height="32" alt="" />
      <img src="icon-${icon.slug}.svg" width="16" height="16" alt="" />
    </div>
  </div>`);
  }
  writeFile(path.join(ICON_DIR, 'index.html'), previewHtml(cards));

  const active = resolveActiveIcon();
  writeFile(path.join(PUBLIC_DIR, 'favicon.svg'), badgeSvg(active));
  writeFile(
    path.join(LOGO_DIR, 'logo_mindforai_h.svg'),
    wordmarkSvg(active, '#050928')
  );
  writeFile(
    path.join(LOGO_DIR, 'logo_mindforai_h_dark.svg'),
    wordmarkSvg(active, '#ffffff')
  );
  console.log(`\nactive icon: ${active.slug} (${active.label})`);
};

main();
