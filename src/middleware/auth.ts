import { Request, Response, NextFunction } from 'express';
import { SERVER_CONFIG } from '../config';

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey || apiKey !== SERVER_CONFIG.API_KEY) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid API Key' });
        return;
    }

    next();
}; 