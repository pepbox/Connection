import React, { useRef, useCallback, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import Webcam from "react-webcam";
import GlobalButton from "../../../components/ui/button";
import GameHeader from "../../../components/layout/GameHeader";
import { useAppDispatch } from "../../../app/hooks";
import { setCurrentStep } from "../../game/services/gameSlice";
import { useOnboardPlayerMutation } from "../services/player.api";
import { useAppSelector } from "../../../app/hooks";
import { RootState } from "../../../app/store";

const CaptureScreen: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [OnboardPlayer] = useOnboardPlayerMutation();
  const playerName = useAppSelector((state) => state.player.player?.name);
  const teamNumber = useAppSelector((state) => state.player.player?.teamNumber);
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  const isAuthenticated = useAppSelector(
    (state: RootState) => state.player.isAuthenticated
  );

  // Snackbar state for error handling
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "error" });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const capture = useCallback(() => {``
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      dispatch(setCurrentStep(2));
    }
  }, [webcamRef, dispatch]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL for uploaded file
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImage(e.target.result as string);
          dispatch(setCurrentStep(2));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (capturedImage && capturedImage.startsWith("blob:")) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  const handleConfirm = async () => {
    if (!capturedImage) return;

    try {
      // Convert base64 to File object
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      // Create FormData
      const formData = new FormData();
      formData.append("name", playerName || "");
      formData.append("session", sessionId || "");
      formData.append("profilePicture", file);
      formData.append("teamNumber", teamNumber?.toString() || "");

      OnboardPlayer(formData)
        .unwrap()
        .then(() => {
          console.log("Player onboarded successfully");
          dispatch(setCurrentStep(3));
          navigate(`/game/${sessionId}/intro`);
        })
        .catch((error) => {
          console.error("Error onboarding player:", error);
          
          // Extract error message from the API response
          const errorMessage = error?.data?.message || error?.message || "Failed to onboard player. Please try again.";
          
          // Show error snackbar
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: "error",
          });

          // Navigate to login screen after a short delay
          setTimeout(() => {
            navigate(`/game/${sessionId}`);
          }, 3000);
        });
    } catch (error) {
      console.error("Error preparing image data:", error);
      
      // Show error snackbar for image preparation errors
      setSnackbar({
        open: true,
        message: "Failed to process image. Please try again.",
        severity: "error",
      });

      // Navigate to login screen after a short delay
      setTimeout(() => {
        navigate(`/game/${sessionId}`);
      }, 3000);
    }
  };
  const handleRetake = () => {
    dispatch(setCurrentStep(1));
    setCapturedImage(null);
  };

  if (isAuthenticated) {
    return <Navigate to={`/game/${sessionId}/intro`} replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <GameHeader />

      <Box
        sx={{
          bgcolor: "primary.main",
          height: "45vh",
        }}
      />
      {/* Main Content Container */}
      <Box
        sx={{
          maxWidth: "270px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -45%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* White Card Container */}
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            p: 3,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Camera/Image Container */}
          <Box
            sx={{
              width: 220,
              height: 200,
              bgcolor: "black",
              borderRadius: 2,
              mb: 3,
              overflow: "hidden",
              border: "2px solid #f0f0f0",
            }}
          >
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={220}
                height={200}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: "50px",
        }}
      >
        {/* Text */}
        <Typography
          variant="h6"
          sx={{
            color: "black",
            mb: 3,
            textAlign: "center",
            fontWeight: "600",
            fontSize: "16px",
            lineHeight: 1.4,
          }}
        >
          Capture your smile to begin!
        </Typography>

        {/* Buttons */}
        <Box sx={{ width: "100%", px: "20px" }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {capturedImage ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <GlobalButton onClick={handleConfirm}>Confirm</GlobalButton>
              <GlobalButton onClick={handleRetake}>Retake</GlobalButton>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <GlobalButton onClick={capture}>Capture</GlobalButton>
              <GlobalButton
                onClick={handleUploadClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <CloudUpload sx={{ fontSize: 16 }} />
                Upload Photo
              </GlobalButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar for error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaptureScreen;
