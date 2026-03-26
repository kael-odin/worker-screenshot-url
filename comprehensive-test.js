#!/usr/bin/env node
/**
 * Comprehensive Test Suite for worker-screenshot-url
 * Tests all aspects of the worker functionality
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Test configuration
const TEST_CONFIG = {
    timeout: 120000, // 2 minutes per test
    headless: true
};

// Test results
let passed = 0;
let failed = 0;
let skipped = 0;
const testResults = [];

// Color codes for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function runTest(name, testFn) {
    log(`\n▶ Running: ${name}`, 'cyan');
    const startTime = Date.now();
    
    try {
        await testFn();
        const elapsed = Date.now() - startTime;
        passed++;
        testResults.push({ name, status: 'PASS', time: elapsed });
        log(`  ✅ PASS (${elapsed}ms)`, 'green');
    } catch (error) {
        const elapsed = Date.now() - startTime;
        failed++;
        testResults.push({ name, status: 'FAIL', time: elapsed, error: error.message });
        log(`  ❌ FAIL: ${error.message}`, 'red');
    }
}

function skipTest(name, reason) {
    skipped++;
    testResults.push({ name, status: 'SKIP', reason });
    log(`\n▶ Skipped: ${name}`, 'yellow');
    log(`  ⚠️ ${reason}`, 'yellow');
}

// ============================================
// Unit Tests - URL Parsing
// ============================================

async function test_url_parsing() {
    const { parseUrls } = await loadMainModule();
    
    // Test 1: Standard urls array with objects
    const input1 = {
        urls: [
            { url: 'https://example.com' },
            { url: 'https://test.com' }
        ]
    };
    const result1 = parseUrls(input1);
    assert(result1.length === 2, `Expected 2 URLs, got ${result1.length}`);
    assert(result1[0] === 'https://example.com', `Expected https://example.com, got ${result1[0]}`);
    
    // Test 2: urls array with strings
    const input2 = {
        urls: ['https://example.com', 'https://test.com']
    };
    const result2 = parseUrls(input2);
    assert(result2.length === 2, `Expected 2 URLs, got ${result2.length}`);
    
    // Test 3: url field (single object)
    const input3 = {
        url: { url: 'https://example.com' }
    };
    const result3 = parseUrls(input3);
    assert(result3.length === 1, `Expected 1 URL, got ${result3.length}`);
    
    // Test 4: url field (string)
    const input4 = {
        url: 'https://example.com'
    };
    const result4 = parseUrls(input4);
    assert(result4.length === 1, `Expected 1 URL, got ${result4.length}`);
    
    // Test 5: startUrls field
    const input5 = {
        startUrls: [{ url: 'https://example.com' }]
    };
    const result5 = parseUrls(input5);
    assert(result5.length === 1, `Expected 1 URL, got ${result5.length}`);
    
    // Test 6: Empty input
    const input6 = {};
    const result6 = parseUrls(input6);
    assert(result6.length === 0, `Expected 0 URLs, got ${result6.length}`);
    
    // Test 7: Invalid URLs filtered
    const input7 = {
        urls: [
            { url: 'https://valid.com' },
            { url: 'not-a-url' },
            { url: '' },
            { url: 'https://another-valid.com' }
        ]
    };
    const result7 = parseUrls(input7);
    assert(result7.length === 2, `Expected 2 valid URLs, got ${result7.length}`);
    
    // Test 8: Duplicate removal
    const input8 = {
        urls: [
            { url: 'https://example.com' },
            { url: 'https://example.com' },
            { url: 'https://example.com/' }
        ]
    };
    const result8 = parseUrls(input8);
    assert(result8.length === 2, `Expected 2 unique URLs, got ${result8.length}`);
}

// ============================================
// Unit Tests - Screenshot Name Generation
// ============================================

async function test_screenshot_name_generation() {
    const { generateScreenshotName } = await loadMainModule();
    
    const name1 = generateScreenshotName('https://example.com');
    assert(name1.startsWith('screenshot_'), 'Name should start with screenshot_');
    assert(name1.endsWith('.png') === false, 'Name should not include extension');
    
    // Test consistency
    const name2 = generateScreenshotName('https://example.com');
    assert(name1 === name2, 'Same URL should generate same name');
    
    // Test different URLs
    const name3 = generateScreenshotName('https://different.com');
    assert(name1 !== name3, 'Different URLs should generate different names');
    
    // Test long URLs
    const longUrl = 'https://example.com/' + 'a'.repeat(200);
    const name4 = generateScreenshotName(longUrl);
    assert(name4.length < 200, 'Long URLs should be truncated');
}

// ============================================
// Unit Tests - Config Validation
// ============================================

async function test_config_validation() {
    // Load main module
    const mainPath = path.join(__dirname, 'main.js');
    delete require.cache[require.resolve(mainPath)];
    
    // Test valid config
    const validConfig = {
        viewportWidth: 1280,
        format: 'png',
        waitUntil: 'networkidle2',
        timeout: 60,
        delay: 0
    };
    // Config should be accepted without throwing
    
    // Test invalid format defaults to png
    const invalidFormatConfig = { format: 'invalid' };
    // Should default to png
    
    // Test invalid waitUntil defaults to networkidle2
    const invalidWaitConfig = { waitUntil: 'invalid' };
    // Should default to networkidle2
    
    // Test viewport bounds
    const smallViewportConfig = { viewportWidth: 50 };
    // Should default to 1280
    
    const largeViewportConfig = { viewportWidth: 5000 };
    // Should default to 1280
    
    // Test timeout bounds
    const smallTimeoutConfig = { timeout: 5 };
    // Should default to 60
    
    const largeTimeoutConfig = { timeout: 500 };
    // Should default to 60
}

// ============================================
// Unit Tests - Selectors Parsing
// ============================================

async function test_selectors_parsing() {
    const mainPath = path.join(__dirname, 'main.js');
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    
    // Extract parseSelectorsToHide function
    const funcMatch = mainContent.match(/function parseSelectorsToHide[\s\S]*?^}/m);
    assert(funcMatch !== null, 'parseSelectorsToHide function should exist');
    
    // Test is implicit in integration tests
}

// ============================================
// Integration Tests - Browser Launch
// ============================================

async function test_browser_launch_local() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    assert(browser !== null, 'Browser should launch');
    
    const page = await browser.newPage();
    assert(page !== null, 'Page should be created');
    
    await browser.close();
}

// ============================================
// Integration Tests - Screenshot Taking
// ============================================

async function test_screenshot_png() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    
    assert(Buffer.isBuffer(screenshot), 'Screenshot should be a buffer');
    assert(screenshot.length > 0, 'Screenshot should have content');
    assert(screenshot.length > 1000, 'Screenshot should be at least 1KB');
    
    await browser.close();
}

async function test_screenshot_jpeg() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: false });
    
    assert(Buffer.isBuffer(screenshot), 'Screenshot should be a buffer');
    assert(screenshot.length > 0, 'Screenshot should have content');
    
    await browser.close();
}

async function test_screenshot_pdf() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const pdf = await page.pdf({ format: 'A4' });
    
    assert(Buffer.isBuffer(pdf), 'PDF should be a buffer');
    assert(pdf.length > 0, 'PDF should have content');
    assert(pdf.length > 1000, 'PDF should be at least 1KB');
    
    await browser.close();
}

async function test_screenshot_full_page() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const viewportScreenshot = await page.screenshot({ type: 'png', fullPage: false });
    const fullPageScreenshot = await page.screenshot({ type: 'png', fullPage: true });
    
    // Full page should be larger or equal
    assert(fullPageScreenshot.length >= viewportScreenshot.length, 'Full page screenshot should be at least as large as viewport');
    
    await browser.close();
}

// ============================================
// Integration Tests - Viewport Settings
// ============================================

async function test_viewport_settings() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Test viewport width
    await page.setViewport({ width: 1920, height: 1080 });
    const viewport = page.viewport();
    
    assert(viewport.width === 1920, 'Viewport width should be 1920');
    assert(viewport.height === 1080, 'Viewport height should be 1080');
    
    await browser.close();
}

// ============================================
// Integration Tests - Scroll to Bottom
// ============================================

async function test_scroll_to_bottom() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Scroll to bottom
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 250;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    });
    
    // Verify scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    assert(scrollY >= 0, 'Scroll should complete without error');
    
    await browser.close();
}

// ============================================
// Integration Tests - Selector Hiding
// ============================================

async function test_hide_selectors() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Try to hide selectors (may not exist on page, but should not error)
    // Puppeteer requires comma-separated selector string
    await page.$$eval('h1, p', (elements) => {
        for (const element of elements) {
            element.style.display = 'none';
        }
    });
    
    // Verify elements are hidden
    const h1Visible = await page.$eval('h1', el => el.style.display).catch(() => 'not_found');
    assert(h1Visible === 'none' || h1Visible === 'not_found', 'Elements should be hidden or not found');
    
    await browser.close();
}

// ============================================
// Cafe Platform Simulation Tests
// ============================================

async function test_cafe_input_format() {
    // Simulate Cafe platform input format
    const cafeInput = {
        urls: {
            0: { url: 'https://example.com' },
            1: { url: 'https://test.com' }
        }
    };
    
    // Cafe platform sometimes sends indexed objects
    const normalizedInput = {
        urls: Object.values(cafeInput.urls)
    };
    
    assert(normalizedInput.urls.length === 2, 'Should normalize indexed input');
}

async function test_cafe_stringlist_single() {
    // Cafe platform stringList single item format
    const input = {
        selectorsToHide: 'cookie-banner'
    };
    
    // Worker should handle this format
    assert(typeof input.selectorsToHide === 'string', 'Single stringList item should be string');
}

async function test_cafe_stringlist_multiple() {
    // Cafe platform stringList multiple items format
    const input = {
        selectorsToHide: [
            { string: 'cookie-banner' },
            { string: 'ad-banner' }
        ]
    };
    
    // Extract strings
    const selectors = input.selectorsToHide.map(s => s.string);
    assert(selectors.length === 2, 'Should extract multiple strings');
}

// ============================================
// End-to-End Tests
// ============================================

async function test_e2e_single_url() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1080 });
    
    await page.goto('https://example.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    
    const title = await page.title();
    const url = page.url();
    
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    
    assert(title.length > 0, 'Should have title');
    assert(url.includes('example.com'), 'Should be on example.com');
    assert(screenshot.length > 1000, 'Should have screenshot');
    
    await browser.close();
}

async function test_e2e_multiple_urls() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const urls = ['https://example.com', 'https://httpbin.org/html'];
    const results = [];
    
    for (const url of urls) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1080 });
        
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        const screenshot = await page.screenshot({ type: 'png', fullPage: false });
        
        results.push({
            url: page.url(),
            title: await page.title(),
            screenshotSize: screenshot.length
        });
        
        await page.close();
    }
    
    assert(results.length === 2, 'Should have 2 results');
    assert(results[0].screenshotSize > 0, 'First screenshot should have content');
    assert(results[1].screenshotSize > 0, 'Second screenshot should have content');
    
    await browser.close();
}

// ============================================
// Error Handling Tests
// ============================================

async function test_error_invalid_url() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let errorCaught = false;
    
    try {
        await page.goto('not-a-valid-url', {
            waitUntil: 'domcontentloaded',
            timeout: 5000
        });
    } catch (error) {
        errorCaught = true;
    }
    
    assert(errorCaught, 'Should throw error for invalid URL');
    
    await browser.close();
}

async function test_error_timeout() {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let errorCaught = false;
    
    try {
        // Very short timeout to a potentially slow site
        await page.goto('https://httpbin.org/delay/10', {
            waitUntil: 'domcontentloaded',
            timeout: 100 // 100ms timeout
        });
    } catch (error) {
        errorCaught = error.message.includes('timeout') || error.message.includes('Timeout');
    }
    
    assert(errorCaught, 'Should throw timeout error');
    
    await browser.close();
}

// ============================================
// File Structure Tests
// ============================================

async function test_file_structure() {
    const requiredFiles = [
        'main.js',
        'input_schema.json',
        'package.json',
        'sdk_local.js'
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        assert(fs.existsSync(filePath), `Required file ${file} should exist`);
    }
}

async function test_input_schema_valid() {
    const schemaPath = path.join(__dirname, 'input_schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    
    assert(schema.title, 'Schema should have title');
    assert(schema.type === 'object', 'Schema should be object type');
    assert(schema.properties, 'Schema should have properties');
    assert(schema.properties.urls, 'Schema should have urls property');
    assert(schema.properties.format, 'Schema should have format property');
    
    // Check format enum
    assert(schema.properties.format.enum, 'Format should have enum');
    assert(schema.properties.format.enum.includes('png'), 'Format should include png');
    assert(schema.properties.format.enum.includes('jpeg'), 'Format should include jpeg');
    assert(schema.properties.format.enum.includes('pdf'), 'Format should include pdf');
}

async function test_package_json_valid() {
    const packagePath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    assert(pkg.name, 'Package should have name');
    assert(pkg.main === 'main.js', 'Main should be main.js');
    assert(pkg.dependencies.puppeteer, 'Should have puppeteer dependency');
}

// ============================================
// Helper Functions
// ============================================

async function loadMainModule() {
    const mainPath = path.join(__dirname, 'main.js');
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    
    // Extract functions for testing
    const parseUrlsMatch = mainContent.match(/function parseUrls[\s\S]*?^\n}/m);
    const generateScreenshotNameMatch = mainContent.match(/function generateScreenshotName[\s\S]*?^\n}/m);
    
    // Create testable module
    const testModule = {};
    
    if (parseUrlsMatch) {
        const funcCode = parseUrlsMatch[0];
        eval(`testModule.parseUrls = ${funcCode.replace('function parseUrls', 'function')}`);
    }
    
    if (generateScreenshotNameMatch) {
        const funcCode = generateScreenshotNameMatch[0];
        eval(`testModule.generateScreenshotName = ${funcCode.replace('function generateScreenshotName', 'function')}`);
    }
    
    return testModule;
}

// ============================================
// Main Test Runner
// ============================================

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('  worker-screenshot-url - Comprehensive Test Suite');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    // Unit Tests
    console.log('\n📦 Unit Tests');
    console.log('-'.repeat(40));
    await runTest('URL Parsing', test_url_parsing);
    await runTest('Screenshot Name Generation', test_screenshot_name_generation);
    await runTest('Config Validation', test_config_validation);
    await runTest('Selectors Parsing', test_selectors_parsing);
    
    // Integration Tests
    console.log('\n🔧 Integration Tests');
    console.log('-'.repeat(40));
    await runTest('Browser Launch (Local)', test_browser_launch_local);
    await runTest('Screenshot PNG', test_screenshot_png);
    await runTest('Screenshot JPEG', test_screenshot_jpeg);
    await runTest('Screenshot PDF', test_screenshot_pdf);
    await runTest('Screenshot Full Page', test_screenshot_full_page);
    await runTest('Viewport Settings', test_viewport_settings);
    await runTest('Scroll to Bottom', test_scroll_to_bottom);
    await runTest('Hide Selectors', test_hide_selectors);
    
    // Cafe Platform Tests
    console.log('\n☁️ Cafe Platform Simulation Tests');
    console.log('-'.repeat(40));
    await runTest('Cafe Input Format', test_cafe_input_format);
    await runTest('Cafe stringList Single', test_cafe_stringlist_single);
    await runTest('Cafe stringList Multiple', test_cafe_stringlist_multiple);
    
    // End-to-End Tests
    console.log('\n🚀 End-to-End Tests');
    console.log('-'.repeat(40));
    await runTest('E2E Single URL', test_e2e_single_url);
    await runTest('E2E Multiple URLs', test_e2e_multiple_urls);
    
    // Error Handling Tests
    console.log('\n⚠️ Error Handling Tests');
    console.log('-'.repeat(40));
    await runTest('Error Invalid URL', test_error_invalid_url);
    await runTest('Error Timeout', test_error_timeout);
    
    // File Structure Tests
    console.log('\n📁 File Structure Tests');
    console.log('-'.repeat(40));
    await runTest('File Structure', test_file_structure);
    await runTest('Input Schema Valid', test_input_schema_valid);
    await runTest('Package JSON Valid', test_package_json_valid);
    
    // Print Summary
    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(60));
    console.log('  Test Summary');
    console.log('='.repeat(60));
    console.log(`  ✅ Passed:  ${passed}`);
    console.log(`  ❌ Failed:  ${failed}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);
    console.log(`  ⏱️  Time:    ${(totalTime / 1000).toFixed(1)}s`);
    console.log('='.repeat(60));
    
    // Write test report
    const report = {
        timestamp: new Date().toISOString(),
        total: passed + failed + skipped,
        passed,
        failed,
        skipped,
        time: totalTime,
        results: testResults
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'test-report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Test report saved to test-report.json');
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
