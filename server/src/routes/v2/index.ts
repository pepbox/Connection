import express from "express";
import playerV2Routes from "../../modules/players/v2/routes/player.routes";

const router = express.Router();

router.use("/player", playerV2Routes);

export default router;
