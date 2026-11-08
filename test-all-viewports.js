const { chromium } = require('C:\\Users\\HP\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright');
const path = require('path');

const VIEWPORTS = [
  { name: 'desktop_1080p', width: 1920, height: 1080 },
  { name: 'desktop_900p', width: 1440, height: 900 },
  { name: 'laptop_768p', width: 1366, height: 768 },
  { name: 'tablet_landscape', width: 1024, height: 768 },
  { name: 'tablet_portrait', width: 768, height: 1024 },
  { name: 'mobile_phone', width: 390, height: 844 }
];

async function runCompatibilityAudit() {
  console.log('====================================================');
  console.log('🌐 COMPREHENSIVE MULTI-VIEWPORT & COMPATIBILITY AUDIT');
  console.log('====================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height }
    });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Check title
    const title = await page.title();
    totalTests++;
    if (title.includes('Graph-Based Network Anomaly & Fraud Detection System')) {
      console.log(`  ✅ [${vp.name}] Document title verified: "${title}"`);
      passedTests++;
    } else {
      console.error(`  ❌ [${vp.name}] Document title mismatch: "${title}"`);
    }

    // 2. Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    totalTests++;
    if (!hasOverflow) {
      console.log(`  ✅ [${vp.name}] No horizontal page overflow (scrollWidth <= innerWidth)`);
      passedTests++;
    } else {
      console.error(`  ❌ [${vp.name}] Horizontal page overflow detected!`);
    }

    // 3. Check graph canvas is rendered
    const hasCanvas = await page.locator('canvas').count();
    totalTests++;
    if (hasCanvas > 0) {
      console.log(`  ✅ [${vp.name}] Cytoscape HTML5 canvas elements active (${hasCanvas} canvas layer(s))`);
      passedTests++;
    } else {
      console.error(`  ❌ [${vp.name}] No canvas rendered`);
    }

    // 4. Check tab navigation
    await page.click('button:has-text("DSA Internals")');
    await page.waitForTimeout(400);
    const dsaText = await page.textContent('main');
    totalTests++;
    if (dsaText.includes('Directed Adjacency List') && dsaText.includes('Max-Heap Priority Queue')) {
      console.log(`  ✅ [${vp.name}] DSA Internals tab navigated and content rendered properly`);
      passedTests++;
    } else {
      console.error(`  ❌ [${vp.name}] DSA tab content missing`);
    }

    // 5. Check console errors
    totalTests++;
    if (consoleErrors.length === 0) {
      console.log(`  ✅ [${vp.name}] Zero console errors`);
      passedTests++;
    } else {
      console.error(`  ❌ [${vp.name}] Console errors:`, consoleErrors);
    }

    // Take screenshot for verification on mobile and tablet
    if (vp.name === 'mobile_phone' || vp.name === 'tablet_portrait') {
      const scrPath = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'aefc3fdc-8f5b-44e3-9d37-484dd3fb167c', `compatibility_${vp.name}.png`);
      await page.screenshot({ path: scrPath });
      console.log(`  📸 [${vp.name}] Saved screenshot to compatibility_${vp.name}.png`);
    }

    await page.close();
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`🎯 COMPATIBILITY AUDIT COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================');
}

runCompatibilityAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
