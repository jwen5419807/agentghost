import { Router } from 'express';
import { AdminController } from '../controllers/admin-controller';

export const createAdminRoutes = (controller: AdminController): Router => {
    const router = Router();

    // Route to get browser initialization status
    router.get('/status', (req, res) => controller.getBrowserStatus(req, res));

    // Route to list active sessions
    router.get('/sessions', (req, res) => controller.listSessions(req, res));

    return router;
}; 