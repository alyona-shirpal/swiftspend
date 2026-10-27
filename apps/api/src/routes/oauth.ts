import { Router } from 'express';
import {
  renderAuthorizePage,
  handleOAuthAuthorize,
  handleOAuthToken,
} from '../controllers/oauth';

const router = Router();

router.get('/authorize', renderAuthorizePage);
router.post('/authorize', handleOAuthAuthorize);
router.post('/token', handleOAuthToken);
router.get('/token', handleOAuthToken);

export default router;
