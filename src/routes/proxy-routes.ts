import { Router } from 'express';
import { ProxyController } from '../controllers/proxy-controller';

export const createProxyRoutes = (controller: ProxyController): Router => {
    const router = Router();

    // Existing routes would go here

    // New route to get page title
    router.post('/scrape/title', (req, res) => controller.getPageTitle(req, res));

    // New route to get page HTML content
    router.post('/scrape/content', (req, res) => controller.getPageContent(req, res));

    // New route to extract data using CSS selector
    router.post('/scrape/element', (req, res) => controller.getPageElement(req, res));

    // New route to interact with page elements (click, type, etc.)
    router.post('/scrape/interact', (req, res) => controller.interactWithPage(req, res));

    // New route to take a screenshot of the page
    router.post('/scrape/screenshot', (req, res) => controller.getPageScreenshot(req, res));

    return router;
}; 