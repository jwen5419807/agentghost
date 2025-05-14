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

    // Method to terminate a specific session by ID
    async terminateSession(req: Request, res: Response): Promise<void> {
        const { sessionId } = req.params;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        try {
            // Assuming sessionManager has a method to close a session by ID
            // This will need to be implemented in session-manager.ts later
            const success = await this.sessionManager.closeSession(sessionId); // Hypothetical method call

            if (success) {
                res.json({ status: 'success', message: `Session ${sessionId} terminated.` });
            } else {
                res.status(404).json({ status: 'error', message: `Session ${sessionId} not found or could not be terminated.` });
            }
        } catch (error: any) {
            console.error(`Error terminating session ${sessionId}:`, error);
            res.status(500).json({ status: 'error', message: `Failed to terminate session ${sessionId}`, error: error.message });
        }
    }
} 