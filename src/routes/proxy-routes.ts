import { Router } from 'express';
import { ProxyController } from '../controllers/proxy-controller';

export const createProxyRoutes = (controller: ProxyController): Router => {
    const router = Router();

    // Existing routes would go here

    // New route to get page title
    router.post('/scrape/title', (req, res) => controller.getPageTitle(req, res));

    return router;
}; 