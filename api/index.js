"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Vercel serverless entrypoint.
 *
 * Vercel requires the default export to be an Express app (or a function
 * that acts as an http handler). This file creates the app and exports it.
 *
 * Nothing here changes the existing API behaviour. All routes, middleware,
 * Gemini provider, and controllers live in src/ exactly as before.
 *
 * Local development still uses `npm run dev` → src/app.ts directly.
 */
const app_1 = require("../src/app");
const app = (0, app_1.createApp)();
exports.default = app;
//# sourceMappingURL=index.js.map