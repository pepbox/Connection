import express from 'express';
import asyncHandeler from 'express-async-handler';
import * as sessionControllers from '../controllers/session.controller';
import { authenticateUser } from '../../../middlewares/authMiddleware';
import { uploadMiddleware } from '../../../services/fileUpload';

const router = express.Router();

router.put('/update', authenticateUser, asyncHandeler(sessionControllers.updateSession));
router.get('/getSession', asyncHandeler(sessionControllers.getSession));
router.get('/download-selfies/:sessionId', authenticateUser, asyncHandeler(sessionControllers.downloadSessionSelfies));

router.post('/upload-logo/:sessionId', authenticateUser, uploadMiddleware.single("logo", {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"],
  maxFileSize: 5 * 1024 * 1024,
  folder: "logos",
}), asyncHandeler(sessionControllers.uploadSessionLogo));

export default router;
