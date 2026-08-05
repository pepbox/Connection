import React, { useEffect, useState } from "react";
import { DashboardProps } from "../types/interfaces";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import DashboardHeader from "./DashboardHeader";
import PlayerTable from "./PlayerTable";
import ForceStartModal from "./ForceStartModal";
import { useUpdateSessionMutation, useLazyCheckPlayersReadinessQuery } from "../services/admin.Api";

const Dashboard: React.FC<DashboardProps> = ({
  headerData,
  players,
}) => {
  const [UpdateSession] = useUpdateSessionMutation();
  const [checkPlayersReadiness] = useLazyCheckPlayersReadinessQuery();
  const [gameStatus, setGameStatus] = useState<string>("pending");

  useEffect(() => {
    setGameStatus(headerData?.gameStatus || "pending");
  }, [headerData?.gameStatus]);
  
  // Force start modal state
  const [forceStartModalOpen, setForceStartModalOpen] = useState(false);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [confirmStartDialogOpen, setConfirmStartDialogOpen] = useState(false);
  const [confirmPauseDialogOpen, setConfirmPauseDialogOpen] = useState(false);
  const [confirmResumeDialogOpen, setConfirmResumeDialogOpen] = useState(false);

  const onGameStatusChange = async () => {
    try {
      setIsCheckingReadiness(true);
      
      // Check if all players are ready (V2)
      const readinessResult = await checkPlayersReadiness({}).unwrap();
      
      if (readinessResult.allReady) {
        // All players are ready, show confirmation dialog
        setConfirmStartDialogOpen(true);
      } else {
        // Some players aren't ready, show force start modal
        setPendingPlayers(readinessResult.pendingPlayers || []);
        setTotalPlayers(readinessResult.totalPlayers || 0);
        setForceStartModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to check players readiness:", error);
      // If check fails, show confirmation dialog
      setConfirmStartDialogOpen(true);
    } finally {
      setIsCheckingReadiness(false);
    }
  };

  const startGame = () => {
    console.log("Starting connection game...");
    UpdateSession({
      status: "playing",
      gameVersion: "v2"
    })
      .unwrap()
      .then(() => {
        setGameStatus("playing");
        console.log("Session updated successfully");
      })
      .catch((error) => {
        console.error("Failed to update session:", error);
      });
  };

  const pauseGame = () => {
    console.log("Pausing connection game...");
    UpdateSession({
      status: "paused",
      gameVersion: "v2"
    })
      .unwrap()
      .then(() => {
        setGameStatus("paused");
        console.log("Session updated to paused");
      })
      .catch((error) => {
        console.error("Failed to pause session:", error);
      });
  };

  const resumeGame = () => {
    console.log("Resuming connection game...");
    UpdateSession({
      status: "playing",
      gameVersion: "v2"
    })
      .unwrap()
      .then(() => {
        setGameStatus("playing");
        console.log("Session updated to playing");
      })
      .catch((error) => {
        console.error("Failed to resume session:", error);
      });
  };

  const handleForceStartWait = () => {
    setForceStartModalOpen(false);
  };

  const handleForceStartConfirm = () => {
    setForceStartModalOpen(false);
    setConfirmStartDialogOpen(true);
  };

  return (
    <Box sx={{ py: 3 }}>
      <DashboardHeader
        data={{ ...headerData, gameStatus }}
        onGameStatusChange={onGameStatusChange}
        onPauseGame={() => setConfirmPauseDialogOpen(true)}
        onResumeGame={() => setConfirmResumeDialogOpen(true)}
        isCheckingReadiness={isCheckingReadiness}
      />
      <Box sx={{ px: 4 }}>
        <PlayerTable
          players={players}
          customQuestionsCount={headerData?.customQuestionsCount}
        />
      </Box>

      {/* Game Start Confirmation Dialog */}
      <Dialog 
        open={confirmStartDialogOpen} 
        onClose={() => setConfirmStartDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800, pb: 1 }}>Confirm Game Start</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
            Are you sure you want to start the game? This will move all players into the game arena.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmStartDialogOpen(false)} sx={{ fontFamily: '"Josefin Sans", sans-serif', textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmStartDialogOpen(false);
              startGame();
            }}
            variant="contained"
            sx={{
              fontFamily: '"Josefin Sans", sans-serif',
              textTransform: "none",
              backgroundColor: "#4FD1C5",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#3dbbb0" }
            }}
          >
            Start Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Pause Confirmation Dialog */}
      <Dialog 
        open={confirmPauseDialogOpen} 
        onClose={() => setConfirmPauseDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800, pb: 1 }}>Confirm Game Pause</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
            Are you sure you want to pause the game? This will temporarily suspend gameplay for all players.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmPauseDialogOpen(false)} sx={{ fontFamily: '"Josefin Sans", sans-serif', textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmPauseDialogOpen(false);
              pauseGame();
            }}
            variant="contained"
            sx={{
              fontFamily: '"Josefin Sans", sans-serif',
              textTransform: "none",
              backgroundColor: "#ef4444",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#dc2626" }
            }}
          >
            Pause Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Resume Confirmation Dialog */}
      <Dialog 
        open={confirmResumeDialogOpen} 
        onClose={() => setConfirmResumeDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800, pb: 1 }}>Confirm Game Resume</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
            Are you sure you want to resume the game? This will allow players to continue playing.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmResumeDialogOpen(false)} sx={{ fontFamily: '"Josefin Sans", sans-serif', textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmResumeDialogOpen(false);
              resumeGame();
            }}
            variant="contained"
            sx={{
              fontFamily: '"Josefin Sans", sans-serif',
              textTransform: "none",
              backgroundColor: "#10b981",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#059669" }
            }}
          >
            Resume Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Force Start Modal */}
      <ForceStartModal
        open={forceStartModalOpen}
        onClose={handleForceStartWait}
        onWait={handleForceStartWait}
        onForceStart={handleForceStartConfirm}
        pendingPlayers={pendingPlayers}
        totalPlayers={totalPlayers}
      />
    </Box>
  );
};

export default Dashboard;
