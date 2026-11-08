const { chromium } = require('C:\\Users\\HP\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright');
const path = require('path');

async function testUI() {
  console.log('Launching browser to test full UI interaction and verify console logs...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('Navigating to http://localhost:3005...');
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify header and initial KPI cards
  const title = await page.textContent('h1');
  console.log(`Page Title: ${title.trim()}`);

  // 2. Trigger Kosaraju Fraud Ring Detection
  console.log('Clicking "Detect Fraud Rings" button...');
  const fraudBtn = page.locator('button:has-text("Detect Fraud Rings")');
  await fraudBtn.click();
  await page.waitForTimeout(1500);

  // The application automatically navigates to "Findings" tab on completion
  const findingsText = await page.textContent('main');
  const hasDirectedSequence = findingsText.includes('A2 → A3 → A4 → A2');
  console.log(`Directed sequence 'A2 → A3 → A4 → A2' visible in UI: ${hasDirectedSequence}`);

  const hasMathematicallyJustifiedScore = findingsText.includes('60.0');
  console.log(`Mathematically justified score 60.0 visible: ${hasMathematicallyJustifiedScore}`);

  const hasFormulaExplanation = findingsText.includes('₹45,000 / 1000') || findingsText.includes('45,000 / 1000');
  console.log(`Formula explanation visible: ${hasFormulaExplanation}`);

  // Capture screenshot of the findings tab
  const activeFindingsScreenshot = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'scratch', 'final_audit_active_findings.png');
  await page.screenshot({ path: activeFindingsScreenshot });
  console.log(`Saved active findings screenshot to ${activeFindingsScreenshot}`);

  // 3. Test DSA Internals Tab
  console.log('Switching to "DSA Internals" tab...');
  await page.click('button:has-text("DSA Internals")');
  await page.waitForTimeout(800);

  const dsaContent = await page.textContent('main');
  const hasAdjacencyList = dsaContent.includes('Directed Adjacency List');
  const hasMaxHeap = dsaContent.includes('Max-Heap Priority Queue');
  const hasRiskScores = dsaContent.includes('Risk Score Hash Map');
  console.log(`DSA Internals Verified: AdjacencyList=${hasAdjacencyList}, MaxHeap=${hasMaxHeap}, RiskScores=${hasRiskScores}`);

  // 4. Test Transactions Tab
  console.log('Switching to "Transactions" tab...');
  await page.click('button:has-text("Transactions")');
  await page.waitForTimeout(800);

  const txContent = await page.textContent('main');
  const hasTxTable = txContent.includes('Source Account') && txContent.includes('Target Account');
  console.log(`Transactions Tab Verified: ${hasTxTable}`);

  await browser.close();

  console.log('\n--- Console Errors Inspection ---');
  if (consoleErrors.length === 0) {
    console.log('✅ ZERO console errors detected during runtime!');
  } else {
    console.log(`⚠️ Console errors found (${consoleErrors.length}):`, consoleErrors);
  }

  return {
    hasDirectedSequence,
    hasMathematicallyJustifiedScore,
    hasFormulaExplanation,
    hasAdjacencyList,
    hasMaxHeap,
    consoleErrors
  };
}

testUI().catch(err => {
  console.error('UI Test failed:', err);
  process.exit(1);
});
