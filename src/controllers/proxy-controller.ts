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
        } catch (error) {
            console.error('Error getting page title:', error);
            res.status(500).json({ status: 'error', message: 'Failed to get page title', error: error.message });
        }
    }
}