import { Request, Response } from 'express';

export class ProxyController {
    sessionManager: any;

    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    async getPageTitle(req: Request, res: Response): Promise<void> {
        const { url } = req.body;

        if (!url) {
            res.status(400).json({ status: 'error', message: 'URL is required' });
            return;
        }

        try {
            const page = await this.sessionManager.getPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const title = await page.title();

            res.json({ status: 'success', data: { title } });
        } catch (error: any) {
            console.error('Error getting page title:', error);
            res.status(500).json({ status: 'error', message: 'Failed to get page title', error: error.message });
        } finally {
            // Consider closing the page here if not using a pool
            // if (page && page.close) { await page.close(); }
        }
    }

    async getPageContent(req: Request, res: Response): Promise<void> {
        const { url } = req.body;

        if (!url) {
            res.status(400).json({ status: 'error', message: 'URL is required' });
            return;
        }

        try {
            const page = await this.sessionManager.getPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const content = await page.content(); // Get the HTML content

            res.json({ status: 'success', data: { content } });
        } catch (error: any) {
            console.error('Error getting page content:', error);
            res.status(500).json({ status: 'error', message: 'Failed to get page content', error: error.message });
        } finally {
            // Consider closing the page here if not using a pool
            // if (page && page.close) { await page.close(); }
        }
    }

    async getPageElement(req: Request, res: Response): Promise<void> {
        const { url, selector } = req.body;

        if (!url || !selector) {
            res.status(400).json({ status: 'error', message: 'URL and selector are required' });
            return;
        }

        let page;
        try {
            page = await this.sessionManager.getPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Use $$eval to get text content of all matching elements
            const data = await page.$$eval(selector, elements =>
                elements.map(element => element.textContent?.trim())
            );

            res.json({ status: 'success', data });

        } catch (error: any) {
            console.error('Error getting page element:', error);
            res.status(500).json({ status: 'error', message: 'Failed to get page element', error: error.message });
        } finally {
            if (page && page.close) {
                await page.close(); // Ensure the page is closed after use
            }
        }
    }

    async interactWithPage(req: Request, res: Response): Promise<void> {
        const { url, selector, action, text } = req.body; // action could be 'click' or 'type'

        if (!url || !selector || !action) {
            res.status(400).json({ status: 'error', message: 'URL, selector, and action are required' });
            return;
        }

        let page;
        try {
            page = await this.sessionManager.getPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const element = await page.$(selector);

            if (!element) {
                res.status(404).json({ status: 'error', message: `Element with selector ${selector} not found` });
                return;
            }

            if (action === 'click') {
                await element.click();
            } else if (action === 'type' && text !== undefined) {
                await element.type(text);
            } else {
                res.status(400).json({ status: 'error', message: `Unsupported action: ${action} or missing text for type action` });
                return;
            }

            // Optionally wait for navigation or other events after interaction
            // await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

            res.json({ status: 'success', message: `${action} action performed on element with selector ${selector}` });

        } catch (error: any) {
            console.error('Error interacting with page:', error);
            res.status(500).json({ status: 'error', message: 'Failed to interact with page', error: error.message });
        } finally {
            if (page && page.close) {
                await page.close(); // Ensure the page is closed after use
            }
        }
    }

    async getPageScreenshot(req: Request, res: Response): Promise<void> {
        const { url } = req.body;

        if (!url) {
            res.status(400).json({ status: 'error', message: 'URL is required' });
            return;
        }

        let page;
        try {
            page = await this.sessionManager.getPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const screenshotBuffer = await page.screenshot(); // Take screenshot

            res.set('Content-Type', 'image/png');
            res.send(screenshotBuffer);

        } catch (error: any) {
            console.error('Error taking screenshot:', error);
            res.status(500).json({ status: 'error', message: 'Failed to take screenshot', error: error.message });
        } finally {
            if (page && page.close) {
                await page.close(); // Ensure the page is closed after use
            }
        }
    }

    async submitTask(req: Request, res: Response): Promise<void> {
        const { type, url, selector, action, text } = req.body;

        if (!type || !url) {
            res.status(400).json({ status: 'error', message: 'Task type and URL are required' });
            return;
        }

        // Create a simplified request object to pass to specific handlers if needed
        // For now, we'll pass the original req and res, assuming handlers can pick what they need
        // This might need refactoring if task submission logic becomes more complex
        const taskReq = { body: req.body };
        const taskRes = res; // Pass the original response object

        switch (type) {
            case 'getTitle':
                await this.getPageTitle(taskReq as Request, taskRes);
                break;
            case 'getContent':
                await this.getPageContent(taskReq as Request, taskRes);
                break;
            case 'getElement':
                // Ensure selector is provided for this task type
                if (!selector) {
                    res.status(400).json({ status: 'error', message: 'Selector is required for getElement task' });
                    return;
                }
                await this.getPageElement(taskReq as Request, taskRes);
                break;
            case 'interact':
                // Ensure selector and action are provided for this task type
                if (!selector || !action) {
                    res.status(400).json({ status: 'error', message: 'Selector and action are required for interact task' });
                    return;
                }
                await this.interactWithPage(taskReq as Request, taskRes);
                break;
            case 'screenshot':
                await this.getPageScreenshot(taskReq as Request, taskRes);
                break;
            // Add more task types here as needed
            default:
                res.status(400).json({ status: 'error', message: `Unsupported task type: ${type}` });
                break;
        }
    }
}