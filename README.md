# AgentGhost - AI Agent Server for Web Scraping and Automation

## Description

AgentGhost is a backend server built with Node.js and Express.js that utilizes a headless browser (Puppeteer Real Browser) to perform web scraping and automation tasks. It provides API endpoints to control browser sessions and execute various actions on web pages, designed with robustness, configuration flexibility, and graceful shutdown in mind.

## Features Implemented

### Proxy API (`/api`)

These endpoints allow interaction with web pages via the controlled browser sessions.

*   **`POST /api/scrape/title`**: Get the title of a given URL.
    *   **Request Body:**
        ```json
        {
          "url": "string"
        }
        ```
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "data": {
            "title": "string"
          }
        }
        ```
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
        }
        ```

*   **`POST /api/scrape/content`**: Get the full HTML content of a given URL.
    *   **Request Body:**
        ```json
        {
          "url": "string"
        }
        ```
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "data": {
            "content": "string (HTML)"
          }
        }
        ```
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
          "error": "string"
        }
        ```

*   **`POST /api/scrape/element`**: Extract text content from elements matching a CSS selector on a given URL.
    *   **Request Body:**
        ```json
        {
          "url": "string",
          "selector": "string (CSS selector)"
        }
        ```
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "data": ["string (text content of element 1)", "string (text content of element 2)", ...]
        }
        ```
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
          "error": "string"
        }
        ```

*   **`POST /api/scrape/interact`**: Perform an action (click or type) on an element matching a CSS selector on a given URL.
    *   **Request Body:**
        ```json
        {
          "url": "string",
          "selector": "string (CSS selector)",
          "action": "string ('click' or 'type')",
          "text": "string (required if action is 'type')"
        }
        ```
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "message": "string (description of action performed)"
        }
        ```
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
          "error": "string"
        }
        ```

*   **`POST /api/scrape/screenshot`**: Take a screenshot of a given URL.
    *   **Request Body:**
        ```json
        {
          "url": "string"
        }
        ```
    *   **Response Body (Success):** The response will be the screenshot image data (PNG).
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
          "error": "string"
        }
        ```

*   **`POST /api/submit-task`**: Submit a general scraping task with type-specific parameters.
    *   **Request Body:**
        ```json
        {
          "type": "string ('getTitle', 'getContent', 'getElement', 'interact', 'screenshot')",
          "url": "string",
          "selector": "string (optional, required for getElement and interact)",
          "action": "string (optional, required for interact)",
          "text": "string (optional, required for interact type)"
        }
        ```
    *   **Response Body:** Varies based on the task type, similar to the individual `/scrape/*` endpoints.

### Admin API (`/admin`)

These endpoints provide administrative control and monitoring capabilities.

*   **`GET /admin/status`**: Check if the browser instance is initialized.
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "data": {
            "browserInitialized": "boolean"
          }
        }
        ```

*   **`GET /admin/sessions`**: List active browser sessions (pages).
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "data": {
            "sessions": [
              {
                "id": "string (session/page ID)",
                "url": "string (current URL of the page)"
              }
            ]
          }
        }
        ```

*   **`DELETE /admin/sessions/:sessionId`**: Terminate a specific browser session by ID.
    *   **Parameters:** `sessionId` (string) - The ID of the session to terminate.
    *   **Response Body (Success):**
        ```json
        {
          "status": "success",
          "message": "string (confirmation of termination)"
        }
        ```
    *   **Response Body (Error):**
        ```json
        {
          "status": "error",
          "message": "string"
          "error": "string"
        }
        ```

## Technical Stack

*   Node.js
*   Express.js
*   Puppeteer Real Browser
*   TypeScript
*   Winston (for logging)
*   body-parser (middleware)
*   pm2 (for process management)
*   pnpm (package manager)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd agentghost
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  (Optional) Install `xvfb` for running headless in Linux without a display:
    ```bash
    sudo apt-get install xvfb
    ```

## Configuration

Configuration is managed in `src/config.ts` and can be influenced by environment variables (e.g., `API_KEY`, `PORT`).

*   `SERVER_CONFIG.PORT`: The port the Express server listens on (default: 3000).
*   `SERVER_CONFIG.API_KEY`: The API key required for accessing secured endpoints. It's recommended to set this via the `API_KEY` environment variable.
*   `PUPPETEER_CONFIG.MAX_PAGES`: Maximum number of concurrent browser pages.
*   `PUPPETEER_CONFIG.PAGE_IDLE_TIMEOUT`: How long an idle page should be kept (not yet fully implemented).
*   `PUPPETEER_CONFIG.HEADLESS_MODE`: Set to `true`, `false`, or `'auto'` to control headless mode.
*   `PUPPETEER_CONFIG.USER_DATA_DIR`: Directory for browser user data.
*   `PUPPETEER_CONFIG.DEFAULT_URLS`: Array of URLs to open on browser initialization.
*   `PROXY_CONFIG`: Configuration for using an upstream proxy for browser connections.

## Running the Project

1.  Build the TypeScript code:
    ```bash
    pnpm build
    ```
2.  Start the server (using ts-node for development or node for production build):
    ```bash
    # Development
    pnpm dev

    # Production (after build)
    pnpm start:prod
    ```

You can also use PM2 for process management in production (`pnpm pm2:start`).

## Project Structure

```
agentghost/
├── src/
│   ├── controllers/     # Request handlers for API endpoints
│   ├── logger/          # Logging utilities
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── utils/           # General utilities
│   ├── config.ts        # Configuration settings
│   ├── server.ts        # Main application entry point
│   └── session-manager.ts # Manages Puppeteer browser sessions/pages
├── .gitignore
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md          # Project documentation
├── tech.md
├── tsconfig.json
└── tslint.json
```

## Future Enhancements (Based on Plan)

*   Implement full page pooling and idle timeout logic in `PuppeteerSessionManager`.
*   Implement a proper task queue/scheduling system.
*   Add more advanced admin features (e.g., viewing logs, dynamic config).
*   Improve error handling and reporting.
*   Implement rate limiting.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.