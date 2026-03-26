#!/usr/bin/env node
'use strict'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const puppeteer = require('puppeteer')
const crypto = require('crypto')

/**
 * Auto-detect runtime environment and load correct SDK
 */
function getSDK() {
    if (global.cafesdk) return global.cafesdk;
    if (process.env.LOCAL_DEV === '1') {
        return require('./sdk_local');
    }
    try {
        return require('./sdk');
    } catch (err) {
        console.log('[WARN] Failed to load gRPC SDK, falling back to local SDK');
        return require('./sdk_local');
    }
}

const cafesdk = new Proxy({}, {
    get: function(target, prop) {
        return getSDK()[prop];
    }
});

const DEFAULT_CONFIG = {
    urls: [],
    viewportWidth: 1280,
    format: 'png',
    fullPage: true,
    scrollToBottom: false,
    delayAfterScrolling: 0,
    waitUntil: 'networkidle2',
    delay: 0,
    timeout: 60,
    selectorsToHide: [],
    waitForSelector: '',
    blockAds: true,
    debugMode: false
}

const VALID_FORMATS = ['png', 'jpeg', 'pdf']
const VALID_WAIT_UNTIL = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']

/**
 * Generate unique screenshot name from URL
 */
function generateScreenshotName(url) {
    const sanitize = (name) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const urlPart = url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 80)
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8)
    return `screenshot_${sanitize(urlPart)}_${hash}`
}

/**
 * Parse URLs from input (handles multiple formats)
 */
function parseUrls(input) {
    const urls = []
    
    const processItem = (item) => {
        if (typeof item === 'string') {
            const trimmed = item.trim()
            if (!trimmed) return null
            try {
                new URL(trimmed)
                return trimmed
            } catch {
                return null
            }
        }
        if (item && item.url) {
            const trimmed = item.url.trim()
            if (!trimmed) return null
            try {
                new URL(trimmed)
                return trimmed
            } catch {
                return null
            }
        }
        return null
    }
    
    // Handle urls array
    if (input.urls) {
        if (Array.isArray(input.urls)) {
            for (const item of input.urls) {
                const url = processItem(item)
                if (url) urls.push(url)
            }
        }
    }
    
    // Handle url field (Cafe platform sometimes uses this)
    if (input.url) {
        if (Array.isArray(input.url)) {
            for (const item of input.url) {
                const url = processItem(item)
                if (url) urls.push(url)
            }
        } else if (typeof input.url === 'string') {
            const url = processItem(input.url)
            if (url) urls.push(url)
        } else if (typeof input.url === 'object') {
            const url = processItem(input.url)
            if (url) urls.push(url)
        }
    }
    
    // Handle startUrls field (alternative naming)
    if (input.startUrls) {
        if (Array.isArray(input.startUrls)) {
            for (const item of input.startUrls) {
                const url = processItem(item)
                if (url) urls.push(url)
            }
        }
    }
    
    return [...new Set(urls)] // Remove duplicates
}

/**
 * Parse selectors to hide (handles multiple formats)
 */
function parseSelectorsToHide(input) {
    const selectors = []
    
    if (input.selectorsToHide) {
        if (Array.isArray(input.selectorsToHide)) {
            for (const item of input.selectorsToHide) {
                if (typeof item === 'string') {
                    selectors.push(item)
                } else if (item && item.string) {
                    selectors.push(item.string)
                }
            }
        } else if (typeof input.selectorsToHide === 'string') {
            // Cafe platform stringList single item format
            selectors.push(input.selectorsToHide)
        }
    }
    
    return selectors.filter(s => s && s.trim())
}

class ScreenshotWorker {
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.browser = null
        this.isLocalBrowser = false
        this.results = []
        this.startTime = Date.now()
        
        // Validate config
        this._validateConfig()
    }
    
    _validateConfig() {
        if (!VALID_FORMATS.includes(this.config.format)) {
            this.config.format = 'png'
        }
        if (!VALID_WAIT_UNTIL.includes(this.config.waitUntil)) {
            this.config.waitUntil = 'networkidle2'
        }
        if (this.config.viewportWidth < 100 || this.config.viewportWidth > 3840) {
            this.config.viewportWidth = 1280
        }
        if (this.config.timeout < 10 || this.config.timeout > 300) {
            this.config.timeout = 60
        }
        if (this.config.delay < 0 || this.config.delay > 300000) {
            this.config.delay = 0
        }
    }
    
    async init() {
        await cafesdk.log.info('Initializing Screenshot Worker...')
        
        const proxyAuth = process.env.PROXY_AUTH
        let browserWSEndpoint
        
        if (proxyAuth) {
            browserWSEndpoint = `ws://${proxyAuth}@chrome-ws-inner.cafescraper.com`
            await cafesdk.log.info('Using CafeScraper platform browser')
        } else if (process.env.CDP_ENDPOINT) {
            browserWSEndpoint = process.env.CDP_ENDPOINT
        } else if (process.env.BROWSER_WS_ENDPOINT) {
            browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT
        } else if (process.env.LOCAL_DEV === '1') {
            await cafesdk.log.info('LOCAL_DEV mode: launching local browser')
            this.browser = await puppeteer.launch({
                headless: true,
                ignoreHTTPSErrors: true,
                args: [
                    '--disable-gpu',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security'
                ]
            })
            this.isLocalBrowser = true
            await cafesdk.log.info('Local browser launched')
            return
        } else {
            throw new Error('No browser endpoint configured. PROXY_AUTH should be set by CafeScraper platform.')
        }
        
        try {
            this.browser = await puppeteer.connect({
                browserWSEndpoint,
                defaultViewport: null,
                ignoreHTTPSErrors: true,
                timeout: 60000
            })
            await cafesdk.log.info('Connected to browser successfully')
        } catch (connectError) {
            await cafesdk.log.error(`Failed to connect browser: ${connectError.message}`)
            throw connectError
        }
    }
    
    async close() {
        if (this.browser) {
            if (this.isLocalBrowser) {
                await this.browser.close()
            } else {
                this.browser.disconnect()
            }
        }
    }
    
    async createPage() {
        const page = await this.browser.newPage()
        
        // Set viewport
        await page.setViewport({
            width: this.config.viewportWidth,
            height: 1080
        })
        
        // Block ads and trackers
        if (this.config.blockAds) {
            await this._setupAdBlocking(page)
        }
        
        // Set timeouts
        const timeoutMs = this.config.timeout * 1000
        page.setDefaultTimeout(timeoutMs)
        page.setDefaultNavigationTimeout(timeoutMs)
        
        return page
    }
    
    async _setupAdBlocking(page) {
        try {
            await page.setRequestInterception(true)
        } catch (e) {
            return
        }
        
        const blockedPatterns = [
            'google-analytics.com', 'googletagmanager.com', 'googleadservices.com',
            'facebook.net', 'facebook.com/tr', 'connect.facebook.net',
            'hotjar.com', 'sentry.io', 'newrelic.com', 'datadog',
            'doubleclick.net', 'googlesyndication.com', 'analytics.',
            'intercom.io', 'crisp.chat', 'tawk.to', 'fullstory.com',
            'hubspot.com', 'segment.io', 'amplitude.com', 'mixpanel.com',
            'optimizely.com', 'kissmetrics.com', 'adservice.google',
            'ads.twitter.com', 'ads.linkedin.com', 'pixel.facebook.com'
        ]
        
        page.on('request', (request) => {
            const resourceType = request.resourceType()
            const url = request.url()
            
            // Block ads and tracking
            if (blockedPatterns.some(p => url.toLowerCase().includes(p))) {
                request.abort()
                return
            }
            
            // Block unnecessary resources for screenshots
            if (['font', 'media'].includes(resourceType)) {
                request.abort()
                return
            }
            
            request.continue()
        })
    }
    
    async scrollToBottom(page) {
        try {
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0
                    const distance = 250
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight
                        window.scrollBy(0, distance)
                        totalHeight += distance
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer)
                            resolve()
                        }
                    }, 50)
                })
            })
            
            // Wait for network idle after scroll if enabled
            if (this.config.delayAfterScrolling > 0) {
                await this.delay(this.config.delayAfterScrolling)
            }
        } catch (error) {
            if (this.config.debugMode) {
                await cafesdk.log.warn(`Scroll to bottom failed: ${error.message}`)
            }
        }
    }
    
    async hideSelectors(page, selectors) {
        if (!selectors || selectors.length === 0) return
        
        try {
            await page.$$eval(selectors, (elements) => {
                for (const element of elements) {
                    element.style.display = 'none'
                }
            })
        } catch (error) {
            if (this.config.debugMode) {
                await cafesdk.log.warn(`Hide selectors failed: ${error.message}`)
            }
        }
    }
    
    async takeScreenshot(page, url) {
        const screenshotName = generateScreenshotName(url)
        const screenshotPath = `${screenshotName}.${this.config.format}`
        
        let screenshotBuffer
        let contentType
        
        try {
            switch (this.config.format) {
                case 'jpeg':
                    screenshotBuffer = await page.screenshot({
                        type: 'jpeg',
                        quality: 90,
                        fullPage: this.config.fullPage
                    })
                    contentType = 'image/jpeg'
                    break
                case 'pdf':
                    screenshotBuffer = await page.pdf({
                        format: 'A4',
                        printBackground: true
                    })
                    contentType = 'application/pdf'
                    break
                case 'png':
                default:
                    screenshotBuffer = await page.screenshot({
                        type: 'png',
                        fullPage: this.config.fullPage
                    })
                    contentType = 'image/png'
                    break
            }
            
            return {
                screenshotName,
                screenshotPath,
                screenshotBuffer,
                contentType,
                size: screenshotBuffer.length
            }
        } catch (error) {
            throw new Error(`Screenshot failed: ${error.message}`)
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    async processUrl(url) {
        const result = {
            startUrl: url,
            url: null,
            title: null,
            screenshotName: null,
            screenshotSize: null,
            format: this.config.format,
            viewportWidth: this.config.viewportWidth,
            fullPage: this.config.fullPage,
            error: null,
            loadedAt: null
        }
        
        let page = null
        
        try {
            page = await this.createPage()
            
            // Navigate to URL
            await page.goto(url, {
                waitUntil: this.config.waitUntil,
                timeout: this.config.timeout * 1000
            })
            
            // Update final URL
            result.url = page.url()
            
            // Wait for selector if specified
            if (this.config.waitForSelector) {
                try {
                    await page.waitForSelector(this.config.waitForSelector, {
                        timeout: 10000
                    })
                } catch (e) {
                    if (this.config.debugMode) {
                        await cafesdk.log.warn(`Wait for selector failed: ${e.message}`)
                    }
                }
            }
            
            // Apply delay if specified
            if (this.config.delay > 0) {
                await this.delay(this.config.delay)
            }
            
            // Scroll to bottom if enabled
            if (this.config.scrollToBottom) {
                await this.scrollToBottom(page)
            }
            
            // Hide selectors
            const selectors = parseSelectorsToHide(this.config)
            if (selectors.length > 0) {
                await this.hideSelectors(page, selectors)
            }
            
            // Get page title
            result.title = await page.title()
            
            // Take screenshot
            await cafesdk.log.info(`Taking screenshot of ${url}...`)
            const screenshot = await this.takeScreenshot(page, url)
            
            result.screenshotName = screenshot.screenshotName
            result.screenshotSize = screenshot.size
            result.loadedAt = new Date().toISOString()
            
            // Convert screenshot to base64 and embed in output
            // This is required because Cafe SDK doesn't support file storage
            const base64 = screenshot.screenshotBuffer.toString('base64')
            result.screenshotBase64 = base64
            result.screenshotDataUrl = `data:${screenshot.contentType};base64,${base64}`
            
            // Save screenshot to file for local testing
            if (this.isLocalBrowser) {
                const fs = require('fs')
                const outputPath = `./${screenshot.screenshotPath}`
                fs.writeFileSync(outputPath, screenshot.screenshotBuffer)
                result.screenshotPath = outputPath
            }
            
            if (this.config.debugMode) {
                await cafesdk.log.debug(`Screenshot saved: ${screenshot.screenshotName} (${(screenshot.size / 1024).toFixed(1)} KB)`)
            }
            
            await cafesdk.log.info(`Screenshot completed: ${url}`)
            
        } catch (error) {
            result.error = error.message
            await cafesdk.log.error(`Failed: ${url} - ${error.message}`)
        } finally {
            if (page) {
                try {
                    await page.close()
                } catch (e) {}
            }
        }
        
        return result
    }
    
    async run(urls) {
        if (!urls || urls.length === 0) {
            throw new Error('No URLs provided')
        }
        
        await this.init()
        
        await cafesdk.log.info(`Starting Screenshot Worker`)
        await cafesdk.log.info(`   URLs: ${urls.length} | Format: ${this.config.format} | Viewport: ${this.config.viewportWidth}px`)
        await cafesdk.log.info(`   Full Page: ${this.config.fullPage} | Wait Until: ${this.config.waitUntil}`)
        
        const headers = [
            { label: 'URL', key: 'url', format: 'text' },
            { label: 'Title', key: 'title', format: 'text' },
            { label: 'Screenshot', key: 'screenshotName', format: 'text' },
            { label: 'Size (KB)', key: 'screenshotSize', format: 'integer' },
            { label: 'Format', key: 'format', format: 'text' },
            { label: 'Preview', key: 'screenshotDataUrl', format: 'image' },
            { label: 'Error', key: 'error', format: 'text' }
        ]
        await cafesdk.result.setTableHeader(headers)
        
        let successCount = 0
        let failCount = 0
        
        for (const url of urls) {
            const result = await this.processUrl(url)
            
            await cafesdk.result.pushData(result)
            
            if (result.error) {
                failCount++
            } else {
                successCount++
            }
        }
        
        await this.close()
        
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)
        
        await cafesdk.log.info(`Complete! Total: ${urls.length} | Success: ${successCount} | Failed: ${failCount} | Time: ${elapsed}s`)
        
        return {
            total: urls.length,
            success: successCount,
            failed: failCount,
            elapsed: parseFloat(elapsed)
        }
    }
}

async function main() {
    try {
        await cafesdk.log.info('Screenshot Worker started')
        
        const input = await cafesdk.parameter.getInputJSONObject()
        
        if (input.debugMode) {
            await cafesdk.log.debug(`Input: ${JSON.stringify(input)}`)
        }
        
        const worker = new ScreenshotWorker(input)
        const urls = parseUrls(input)
        
        if (urls.length === 0) {
            throw new Error('No valid URLs provided')
        }
        
        await worker.run(urls)
        
    } catch (error) {
        await cafesdk.log.error(`Script error: ${error.message}`)
        await cafesdk.result.pushData({
            error: error.message,
            status: 'error'
        })
        throw error
    }
}

main()
