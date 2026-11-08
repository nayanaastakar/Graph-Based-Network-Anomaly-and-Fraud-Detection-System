const { chromium } = require('C:\\Users\\HP\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'docs', 'images');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureShowcase() {
  console.log('Generating crisp showcase screenshots for GitHub README...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Desktop context
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Screenshot 1: Main Desktop Overview
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_network_topology_overview.png') });
  console.log('Saved 01_network_topology_overview.png');

  // Screenshot 2: Select Node A4 to show Account Inspector Drawer with score formula
  await page.selectOption('select', 'A4');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_account_inspector_drawer.png') });
  console.log('Saved 02_account_inspector_drawer.png');

  // Screenshot 3: Trigger Fraud Ring Detection and show Findings
  const fraudBtn = page.locator('button:has-text("Detect Fraud Rings")');
  await fraudBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_fraud_rings_and_findings.png') });
  console.log('Saved 03_fraud_rings_and_findings.png');

  // Screenshot 4: DSA Internals tab
  await page.click('button:has-text("DSA Internals")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_dsa_internals_and_max_heap.png') });
  console.log('Saved 04_dsa_internals_and_max_heap.png');

  // Screenshot 5: Transactions tab
  await page.click('button:has-text("Transactions")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_transaction_management.png') });
  console.log('Saved 05_transaction_management.png');

  await page.close();

  // Screenshot 6: Tablet Portrait View
  const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await tabletPage.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '06_tablet_responsive_view.png') });
  console.log('Saved 06_tablet_responsive_view.png');
  await tabletPage.close();

  await browser.close();
  console.log('All showcase screenshots successfully generated in docs/images!');
}

captureShowcase().catch(err => {
  console.error('Failed to capture showcase:', err);
  process.exit(1);
});
