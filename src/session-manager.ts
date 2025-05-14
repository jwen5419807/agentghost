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
    private pagePool: any[] = []; // Pool of available pages
    private activePages: Map<string, any> = new Map(); // Map of active pages by ID

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
                // Get a page and its release function
                const { page, release } = await this.getPage();
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    console.log(`Navigated to default URL: ${url}`);
                } catch (error) {
                    console.error(`Failed to navigate to default URL ${url}:`, error);
                } finally {
                    // Release the page back to the pool after use
                    await release();
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
            // Close all active pages first
            for (const page of this.activePages.values()) {
                if (page && page.close) {
                    await page.close();
                }
            }
            this.activePages.clear();

            // Close all pages in the pool
            for (const page of this.pagePool) {
                if (page && page.close) {
                    await page.close();
                }
            }
            this.pagePool = [];

            // Close the browser
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

    async getPage(): Promise<{ page: any, release: () => Promise<void> }> {
        if (!this.browser) {
            throw new Error('Browser not initialized.');
        }

        let page;
        // Check if there's an available page in the pool
        if (this.pagePool.length > 0) {
            page = this.pagePool.pop();
            console.log('Reusing page from pool.');
        } else if (this.activePages.size < this.config.MAX_PAGES) {
            // Create a new page if the pool is empty and we haven't reached max pages
            page = await this.browser.newPage();
            console.log('Created a new page.');
        } else {
            // If max pages reached, throw an error or implement a waiting mechanism
            throw new Error('Max pages reached. Please try again later.');
        }

        // Assign a unique ID to the page and add it to active pages
        const pageId = page.target()._targetId; // Using target ID as a unique identifier
        this.activePages.set(pageId, page);

        const release = async () => {
            if (this.activePages.has(pageId)) {
                const releasedPage = this.activePages.get(pageId);
                this.activePages.delete(pageId);
                // Clean up the page before returning it to the pool (optional but recommended)
                try {
                    await releasedPage.evaluate(() => {
                        // Clear cookies, local storage, session storage, etc.
                        document.cookie.split(';').forEach(function (c) { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); });
                        localStorage.clear();
                        sessionStorage.clear();
                    });
                    // Navigate to a blank page to ensure no state leaks
                    await releasedPage.goto('about:blank');
                    // Return the page to the pool if cleanup was successful
                    this.pagePool.push(releasedPage);
                    console.log(`Page ${pageId} released to pool. Pool size: ${this.pagePool.length}`);
                } catch (error) {
                    console.error(`Error cleaning up page ${pageId}:`, error);
                    // If cleanup fails, close the page instead of returning it to the pool
                    if (releasedPage && releasedPage.close) {
                        await releasedPage.close();
                    }
                }
            } else {
                console.warn(`Attempted to release unknown page ${pageId}.`);
            }
        };

        return { page, release };
    }

    async getActiveSessions(): Promise<any[]> { // Method to list active pages
        if (!this.browser) {
            return []; // Return empty array if browser is not initialized
        }
        // Return information about pages in the activePages map
        return Array.from(this.activePages.entries()).map(([id, page]) => ({
            id,
            url: page.url ? page.url() : 'N/A', // Get URL if page object has the method
        }));
    }

    async closeSession(sessionId: string): Promise<boolean> {
        if (!this.browser) {
            console.warn(`Attempted to close session ${sessionId} but browser is not initialized.`);
            return false;
        }

        const pageToClose = this.activePages.get(sessionId);

        if (pageToClose) {
            console.log(`Closing session ${sessionId}...`);
            try {
                // Remove from active pages before closing
                this.activePages.delete(sessionId);
                if (pageToClose && pageToClose.close) {
                    await pageToClose.close();
                }
                console.log(`Session ${sessionId} closed.`);
                return true;
            } catch (error) {
                console.error(`Error closing session ${sessionId}:`, error);
                // If closing fails, ensure it's removed from active pages
                this.activePages.delete(sessionId);
                throw new Error(`Failed to close session ${sessionId}`);
            }
        } else {
            console.warn(`Session ${sessionId} not found in active sessions.`);
            return false;
        }
    }
}

export default PuppeteerSessionManager; 