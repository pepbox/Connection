import express from 'express';
import asyncHandeler from 'express-async-handler';
import * as playerControllers from '../controllers/player.controller';
import * as teamControllers from '../../../teams/controllers/team.controller';
import { authenticateUser } from '../../../../middlewares/authMiddleware';
import { uploadMiddleware } from '../../../../services/fileUpload';

const router = express.Router();

router.post('/onboardPlayer', uploadMiddleware.single("profilePicture", {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif"],
  maxFileSize: 20 * 1024 * 1024,
  folder: "profile-pictures",
}), asyncHandeler(playerControllers.onboardPlayer));

router.get('/getAllTeams/:sessionId', asyncHandeler(teamControllers.getAllTeamsBySessionId));
router.get('/fetchPlayer', authenticateUser, asyncHandeler(playerControllers.fetchPlayer));
router.get('/getPlayersBySession', authenticateUser, asyncHandeler(playerControllers.getPlayersBySession));
router.post('/logout', authenticateUser, asyncHandeler(playerControllers.logoutPlayer));

export default router;
