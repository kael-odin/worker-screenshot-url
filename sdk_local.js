/**
 * Local SDK for testing worker-screenshot-url
 * Simulates CafeScraper platform SDK locally
 */

const fs = require('fs');
const path = require('path');

// Results storage
let results = [];
let tableHeaders = [];

// Create SDK mock
const sdk = {
    parameter: {
        getInputJSONString: async function() {
            const testInputPath = path.join(__dirname, 'test-input.json');
            if (fs.existsSync(testInputPath)) {
                return fs.readFileSync(testInputPath, 'utf-8');
            }
            return JSON.stringify({
                urls: [{ url: 'https://example.com' }],
                viewportWidth: 1280,
                format: 'png',
                fullPage: true,
                scrollToBottom: false,
                delay: 0,
                waitUntil: 'networkidle2',
                timeout: 60,
                debugMode: true
            });
        },
        getInputJSONObject: async function() {
            const str = await this.getInputJSONString();
            return JSON.parse(str);
        }
    },
    
    result: {
        setTableHeader: async function(headers) {
            tableHeaders = headers;
            console.log('[SDK] Table headers set:', headers.map(h => h.key).join(', '));
        },
        pushData: async function(obj) {
            results.push(obj);
            const preview = obj.title ? obj.title.substring(0, 40) : obj.startUrl?.substring(0, 40) || 'result';
            console.log(`[SDK] Result #${results.length}: ${preview}${obj.error ? ' (ERROR)' : ''}`);
        }
    },
    
    log: {
        debug: async function(msg) {
            console.log(`[DEBUG] ${msg}`);
        },
        info: async function(msg) {
            console.log(`[INFO] ${msg}`);
        },
        warn: async function(msg) {
            console.log(`[WARN] ${msg}`);
        },
        error: async function(msg) {
            console.log(`[ERROR] ${msg}`);
        }
    }
};

// Export results for testing
sdk._getResults = () => results;
sdk._clearResults = () => { results = []; tableHeaders = []; };
sdk._getTableHeaders = () => tableHeaders;

module.exports = sdk;
