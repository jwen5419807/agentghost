import { connect } from 'puppeteer-real-browser';

interface ProxyConfig {
    HOST: string;
    PORT?: number | string; // PORT might be a string from config
    USERNAME?: string;
    PASSWORD?: string;
}

interface PuppeteerConfig {
    MAX_PAGES: number;
    PAGE_IDLE_TIMEOUT: number;
    HEADLESS_MODE: boolean | 'auto'; // Allow 'auto' string
    USER_DATA_DIR: string;
    DEFAULT_URLS: string[];
    proxy?: ProxyConfig; // Add optional proxy property
}

class PuppeteerSessionManager {
    browser: any | null = null; // Use any for now based on puppeteer-real-browser usage

    constructor(private config: any) { } // Revert to any for simpler config handling

    async initialize(urls: string[] = []) {
        if (this.browser) {
            console.log('Browser already initialized.');
            return;
        }

        console.log('Connecting to browser...');
        try {
            const headlessMode = this.config.HEADLESS_MODE === false ? false : true; // Map 'auto' and true to true (headless), false to false (headful)

            const response = await connect({
                headless: headlessMode, // Use the mapped boolean value
                customConfig: { // Add customConfig object
                    userDataDir: this.config.USER_DATA_DIR // Move userDataDir here
                },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-features=site-per-process',
                    '--enable-features=NetworkService',
                ],
                proxy: this.config.proxy?.HOST ? { // Add proxy configuration if HOST is provided, using optional chaining and checking HOST
                    host: this.config.proxy.HOST,
                    port: this.config.proxy.PORT ? Number(this.config.proxy.PORT) : undefined, // Ensure port is number or undefined
                    username: this.config.proxy.USERNAME,
                    password: this.config.proxy.PASSWORD
                } : undefined,
            });

            this.browser = response.browser; // Store the browser instance
            console.log('Browser connected.');

            // Optional: Navigate to default URLs
            for (const url of urls) {
                const page = await this.getPage(); // Get a page from the connected browser
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    console.log(`Navigated to default URL: ${url}`);
                } catch (error) {
                    console.error(`Failed to navigate to default URL ${url}:`, error);
                    // Close the problematic page to not affect other sessions
                    if (page && page.close) { // Check if page is valid and has close method
                        await page.close();
                    }
                }
            }

        } catch (error) {
            console.error('Failed to connect to browser:', error);
            this.browser = null;
            throw error; // Re-throw the error to be caught by the caller
        }
    }

    async exit() {
        if (this.browser) {
            console.log('Closing browser...');
            // Check if the browser object has a close method before calling it
            if (this.browser.close) {
                await this.browser.close();
            }
            this.browser = null;
            console.log('Browser closed.');
        }
    }

    isBrowserInitialized(): boolean {
        return this.browser !== null;
    }

    async getPage(): Promise<any> { // Use any for the Page type
        if (!this.browser) {
            throw new Error('Browser not initialized.');
        }
        // Create a new page using the browser instance from connect
        // TODO: Implement page pooling/management based on maxPages
        const page = await this.browser.newPage();
        return page;
    }

    async getActiveSessions(): Promise<any[]> { // Method to list active pages
        if (!this.browser) {
            return []; // Return empty array if browser is not initialized
        }
        try {
            const pages = await this.browser.pages();
            const sessions = await Promise.all(pages.map(async (page: any) => {
                try {
                    const url = await page.url();
                    // Puppeteer pages don't have a simple ID, use the target ID
                    const target = page.target();
                    const id = target._targetId; // Accessing internal property, might need a better way
                    return { id, url };
                } catch (error) {
                    console.error('Error getting session info for a page:', error);
                    return null; // Return null for pages where info could not be retrieved
                }
            }));
            // Filter out any null entries that might have resulted from errors
            return sessions.filter(session => session !== null);
        } catch (error: any) {
            console.error('Error getting active sessions:', error);
            throw new Error('Failed to retrieve active sessions');
        }
    }
}

export default PuppeteerSessionManager; 