import { Router } from 'express';
import {
  handleMcpDiscovery,
  handleMcpSse,
  handleMcpMessages,
  handleMcpDirectPost,
} from '../controllers/mcp';
import { renderAuthorizePage } from '../controllers/oauth';

const router = Router();

router.get('/', handleMcpDiscovery);
router.post('/', handleMcpDirectPost);
router.get('/sse', handleMcpSse);
router.post('/messages', handleMcpMessages);
router.get('/authorize', renderAuthorizePage);

export default router;
