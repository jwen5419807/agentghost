import { Request, Response } from 'express';

export class AdminController {
    sessionManager: any;

    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    getBrowserStatus(req: Request, res: Response): void {
        const isInitialized = this.sessionManager.isBrowserInitialized();
        res.json({ status: 'success', data: { browserInitialized: isInitialized } });
    }

    // Method to list active sessions
    async listSessions(req: Request, res: Response): Promise<void> {
        try {
            // Assuming sessionManager has a method to list active sessions
            // This will need to be implemented in session-manager.ts later
            const sessions = await this.sessionManager.getActiveSessions(); // Hypothetical method call
            res.json({ status: 'success', data: { sessions } });
        } catch (error: any) {
            console.error('Error listing sessions:', error);
            res.status(500).json({ status: 'error', message: 'Failed to list sessions', error: error.message });
        }
    }
} 