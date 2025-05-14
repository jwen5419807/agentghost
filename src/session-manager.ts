import { connect } from 'puppeteer-real-browser';

class PuppeteerSessionManager {
    browser: any | null = null; // Use any for now based on puppeteer-real-browser usage

    constructor(private config: any) { }

    async initialize(urls: string[] = []) {
        if (this.browser) {
            console.log('Browser already initialized.');
            return;
        }

        console.log('Connecting to browser...');
        try {
            const response = await connect({
                headless: this.config.headless === true ? true : (this.config.headless === false ? false : 'auto'), // Map config to 'auto', true, or false
                userDataDir: this.config.userDataDir,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-features=site-per-process',
                    '--enable-features=NetworkService',
                ],
            });
            console.log('Browser launched.');

            // Optional: Navigate to default URLs
            for (const url of urls) {
                const page = await this.getPage();
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    console.log(`Navigated to default URL: ${url}`);
                } catch (error) {
                    console.error(`Failed to navigate to default URL ${url}:`, error);
                    // Close the problematic page to not affect other sessions
                    await page.close();
                }
            }

        } catch (error) {
            console.error('Failed to launch browser:', error);
            this.browser = null;
            throw error; // Re-throw the error to be caught by the caller
        }
    }

    async exit() {
        if (this.browser) {
            console.log('Closing browser...');
            await this.browser.close();
            this.browser = null;
            console.log('Browser closed.');
        }
    }

    isBrowserInitialized(): boolean {
        return this.browser !== null;
    }

    async getPage(): Promise<Page> {
        if (!this.browser) {
            throw new Error('Browser not initialized.');
        }
        // For now, create a new page for each request
        // TODO: Implement page pooling/management based on maxPages
        const page = await this.browser.newPage();
        return page;
    }
}

export default PuppeteerSessionManager; 