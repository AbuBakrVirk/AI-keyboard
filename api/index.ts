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
import { createApp } from '../src/app';

const app = createApp();

export default app;
