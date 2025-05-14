import express from 'express';
import bodyParser from 'body-parser';
import { logger, overrideConsole } from './logger';
import { httpLoggerMiddleware } from './middleware/http-logger';
import { responseTimeMiddleware } from './middleware/response-time';
import PuppeteerSessionManager from './session-manager';
import { createProxyRoutes } from './routes/proxy-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { ProxyController } from './controllers/proxy-controller';
import { AdminController } from './controllers/admin-controller';
import { printBanner } from './utils';
import { Request, Response, NextFunction } from 'express';
import {
    SERVER_CONFIG,
    PUPPETEER_CONFIG,
    PROXY_CONFIG,
    RETRY_CONFIG,
} from './config';
import path from 'path';
import { targetUrlMiddleware } from './middleware/target-url';

overrideConsole();

printBanner();

const app = express();

app.use(responseTimeMiddleware);
app.use(httpLoggerMiddleware);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.disable('x-powered-by');

const sessionManager = new PuppeteerSessionManager({
    maxPages: PUPPETEER_CONFIG.MAX_PAGES,
    pageIdleTimeout: PUPPETEER_CONFIG.PAGE_IDLE_TIMEOUT,
    headless: PUPPETEER_CONFIG.HEADLESS_MODE,
    userDataDir: PUPPETEER_CONFIG.USER_DATA_DIR,
    proxy: {
        host: PROXY_CONFIG.HOST,
        port: PROXY_CONFIG.PORT ? Number(PROXY_CONFIG.PORT) : undefined,
        username: PROXY_CONFIG.USERNAME,
        password: PROXY_CONFIG.PASSWORD
    }
});

const proxyController = new ProxyController(sessionManager);
const adminController = new AdminController(sessionManager);

const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === '/health') {
        return next();
    }

    if (!sessionManager.isBrowserInitialized()) {
        logger.warn('Browser not initialized when handling request to Admin');
        res.status(503).json({
            status: 'error',
            message: 'Browser is initializing, please try again later',
            code: 'BROWSER_INITIALIZING'
        });
        return;
    }
    next();
};

app.use('/admin', adminMiddleware);
app.use('/api', targetUrlMiddleware);

app.use('/api', createProxyRoutes(proxyController));
app.use('/admin', createAdminRoutes(adminController));


async function startServer() {
    try {
        app.listen(SERVER_CONFIG.PORT, () => {
            logger.info(`Server is running on port ${SERVER_CONFIG.PORT}`);
        });

        logger.info('Initializing browser with default URLs:', PUPPETEER_CONFIG.DEFAULT_URLS);
        sessionManager.initialize(PUPPETEER_CONFIG.DEFAULT_URLS)
            .then(() => {
                logger.success('Browser initialization completed successfully');
            })
            .catch(error => {
                logger.error('Browser initialization failed:', error);
            });

        process.on('SIGINT', async () => {
            logger.info('Received SIGINT signal. Shutting down gracefully...');
            await sessionManager.exit();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM signal. Shutting down gracefully...');
            await sessionManager.exit();
            process.exit(0);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
