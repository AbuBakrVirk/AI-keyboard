import { Router } from 'express';
import { rewriteHandler } from '../controllers/ai.controller';

const router = Router();

/**
 * POST /api/ai/rewrite
 * Body: { text: string, action: RewriteAction, instruction?: string }
 */
router.post('/rewrite', rewriteHandler);

export default router;
