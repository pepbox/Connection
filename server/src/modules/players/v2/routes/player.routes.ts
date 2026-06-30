import express from 'express';
import asyncHandeler from 'express-async-handler';
import * as playerControllers from '../controllers/player.controller';
import { authenticateUser } from '../../../../middlewares/authMiddleware';
import { uploadMiddleware } from '../../../../services/fileUpload';

const router = express.Router();

router.post('/addCustomQuestions', authenticateUser, asyncHandeler(playerControllers.addCustomQuestions));
router.get('/getCustomQuestions', authenticateUser, asyncHandeler(playerControllers.getCustomQuestions));
router.post('/sendConnectionRequest', authenticateUser, asyncHandeler(playerControllers.sendConnectionRequest));
router.post('/respondToConnectionRequest', authenticateUser, asyncHandeler(playerControllers.respondToConnectionRequest));
router.get('/getConnectionStatus', authenticateUser, asyncHandeler(playerControllers.getConnectionStatus));
router.post('/submitConnectionSelfie', authenticateUser, uploadMiddleware.single("selfie", {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif"],
  maxFileSize: 20 * 1024 * 1024,
  folder: "selfies",
}), asyncHandeler(playerControllers.submitConnectionSelfie));
router.post('/submitCustomAnswers', authenticateUser, asyncHandeler(playerControllers.submitCustomAnswers));
router.get('/getConnectionHistory', authenticateUser, asyncHandeler(playerControllers.getConnectionHistory));

export default router;
