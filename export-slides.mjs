import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const slidesDir = '/tmp/slides';
const outputDir = '/tmp/slides/screenshots';
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

// Serve via file URL
await page.goto(`file://${slidesDir}/spectrum-slides.html`);

// Remove iframes (terminal demos that would timeout)
await page.evaluate(() => {
  document.querySelectorAll('iframe').forEach(f => f.remove());
  document.querySelectorAll('.terminal-container').forEach(el => el.classList.add('offline'));
});

const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

let idx = 0;

for (let i = 0; i < slideCount; i++) {
  const info = await page.evaluate((si) => {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(s => s.classList.remove('active'));
    const slide = slides[si];
    slide.classList.add('active');
    if (!slide.hasAttribute('data-progressive')) return null;
    const type = slide.getAttribute('data-progressive');
    let items;
    if (type === 'table') items = slide.querySelectorAll('tr:not(:first-child)');
    else if (type === 'subtitle') items = slide.querySelectorAll('.subtitle');
    else items = slide.querySelectorAll('li');
    const startsEmpty = type === 'table' || type === 'subtitle';
    items.forEach((item, j) => {
      if (!startsEmpty && j === 0) item.classList.add('visible');
      else item.classList.remove('visible');
    });
    return { totalItems: items.length, startsEmpty };
  }, i);

  await page.waitForTimeout(150);

  if (info) {
    const sv = info.startsEmpty ? 0 : 1;
    // Capture initial state
    const f0 = `slide-${String(idx).padStart(3, '0')}.png`;
    await page.screenshot({ path: path.join(outputDir, f0) });
    console.log(`  Slide ${i + 1} [${sv}/${info.totalItems}] -> ${f0}`);
    idx++;

    // Reveal items one by one
    for (let j = sv; j < info.totalItems; j++) {
      await page.evaluate(({si, ji}) => {
        const slide = document.querySelectorAll('.slide')[si];
        const type = slide.getAttribute('data-progressive');
        let items;
        if (type === 'table') items = slide.querySelectorAll('tr:not(:first-child)');
        else if (type === 'subtitle') items = slide.querySelectorAll('.subtitle');
        else items = slide.querySelectorAll('li');
        items[ji].classList.add('visible');
      }, {si: i, ji: j});
      await page.waitForTimeout(150);
      const f = `slide-${String(idx).padStart(3, '0')}.png`;
      await page.screenshot({ path: path.join(outputDir, f) });
      console.log(`  Slide ${i + 1} [${j + 1}/${info.totalItems}] -> ${f}`);
      idx++;
    }
  } else {
    const f = `slide-${String(idx).padStart(3, '0')}.png`;
    await page.screenshot({ path: path.join(outputDir, f) });
    console.log(`  Slide ${i + 1} -> ${f}`);
    idx++;
  }
}

console.log(`\nTotal screenshots: ${idx}`);
await browser.close();

// Combine into PDF using the screenshots
// We'll generate a simple HTML page with all images and use page.pdf()
const browser2 = await chromium.launch();
const page2 = await browser2.newPage();

const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).sort();
const imagesHtml = files.map(f => {
  const data = fs.readFileSync(path.join(outputDir, f)).toString('base64');
  return `<div style="page-break-after:always;margin:0;padding:0;"><img src="data:image/png;base64,${data}" style="width:100%;height:100%;object-fit:contain;display:block;"></div>`;
}).join('\n');

const html = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}@page{size:1920px 1080px;margin:0;}</style></head><body>${imagesHtml}</body></html>`;

await page2.setContent(html, { waitUntil: 'load' });
await page2.pdf({
  path: '/tmp/slides/spectrum-slides.pdf',
  width: '1920px',
  height: '1080px',
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  printBackground: true,
});

console.log('\nPDF saved to /tmp/slides/spectrum-slides.pdf');
await browser2.close();
