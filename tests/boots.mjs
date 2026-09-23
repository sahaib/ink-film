// A built film boots: every <script> build.sh wrote reaches the page as its own element (nothing in
// the config swallowed the rest of the page) and window.film.ready turns true, with no page error.
//   INK_FILM_TOOLS=<film>/tools node boots.mjs <film.html>
import { chromium } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const html = process.argv[2];
if (!html) { console.error('usage: node boots.mjs <film.html>'); process.exit(2); }
const want = (fs.readFileSync(html, 'utf8').match(/^<script>$/gm) || []).length;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(html)).href + '#t0');
const ready = await page.waitForFunction(() => window.film && window.film.ready, null, { timeout: 15000 }).then(() => true, () => false);
const got = await page.evaluate(() => document.scripts.length);
await browser.close();
const ok = ready && got === want && !errors.length;
console.log(`${ok ? 'PASS' : 'FAIL'}  ${path.basename(path.dirname(path.dirname(html)))} boots: film.ready ${ready}, ${got} of ${want} <script> elements${errors.length ? `, page errors: ${errors.slice(0, 2).join(' | ')}` : ''}`);
process.exit(ok ? 0 : 1);
