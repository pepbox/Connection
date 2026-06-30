import express from 'express';
import asyncHandeler from 'express-async-handler';
import * as sessionControllers from '../controllers/session.controller';
import { authenticateUser } from '../../../middlewares/authMiddleware';

const router = express.Router();

router.put('/update', authenticateUser, asyncHandeler(sessionControllers.updateSession));
router.get('/getSession', asyncHandeler(sessionControllers.getSession));
router.get('/download-selfies/:sessionId', authenticateUser, asyncHandeler(sessionControllers.downloadSessionSelfies));

export default router;
