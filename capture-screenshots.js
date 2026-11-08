const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  console.log('Launching browser for genuine verification screenshots...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // 1. Desktop resolution 1440x900
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3005...');
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Capture default desktop
  const desktopPath = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'scratch', 'updated_dashboard_desktop.png');
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log(`Saved desktop screenshot to ${desktopPath}`);

  // Run Kosaraju Fraud Rings detection to test interaction
  console.log('Clicking Detect Fraud Rings...');
  const fraudBtn = page.locator('text=Detect Fraud Rings');
  if (await fraudBtn.count() > 0) {
    await fraudBtn.click();
    await page.waitForTimeout(1000);
  }

  const activePath = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'scratch', 'updated_dashboard_fraud_rings.png');
  await page.screenshot({ path: activePath, fullPage: false });
  console.log(`Saved active fraud rings screenshot to ${activePath}`);

  // 2. Mobile resolution 390x844 (iPhone 13 / modern mobile)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  const mobilePath = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'scratch', 'updated_dashboard_mobile.png');
  await mobilePage.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Saved mobile screenshot to ${mobilePath}`);

  await browser.close();
  console.log('Finished capturing all verification screenshots.');
}

capture().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
