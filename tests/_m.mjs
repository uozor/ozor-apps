import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile:true, hasTouch:true, acceptDownloads: true, reducedMotion:'reduce' });
await p.route(u => !/127\.0\.0\.1:8765/.test(u.href), r => r.fulfill({ status: 200, body: '' }));
await p.goto('http://127.0.0.1:8765/tax-calculator/'); await p.fill('#sal','100000');
const c = p.locator('#pricing'); await c.scrollIntoViewIfNeeded(); await c.screenshot({ path: '/workspace/screens/export-left-mobile.png' });

