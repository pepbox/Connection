import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";
import GlobalButton from "../../../../components/ui/button";
import GameHeader from "../../../../components/layout/GameHeader";
import { useAppDispatch } from "../../../../app/hooks";
import { setCurrentStep } from "../../../game/services/gameSlice";

const V2IntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const sessionId = useParams<{ sessionId: string }>().sessionId;
  const [currentStep, setCurrentStepLocal] = useState(0);
  const [viewedSteps, setViewedSteps] = useState<Set<number>>(new Set([0])); // Track viewed steps, start with step 0

  const handleJumpIn = () => {
    dispatch(setCurrentStep(4));
    navigate(`/game/${sessionId}/custom-questions`);
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStepLocal(stepIndex);
    setViewedSteps((prev) => new Set([...prev, stepIndex]));
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      handleStepChange(currentStep + 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    handleStepChange(stepIndex);
  };

  // Check if all steps have been viewed
  const allStepsViewed = viewedSteps.size === 4;

  const gameSteps = [
    {
      id: 0,
      icon: "📝",
      title: "Create Questions",
      description: "Write custom questions and fun trivia about yourself.",
    },
    {
      id: 1,
      icon: "🔗",
      title: "Find a Partner",
      description: "Search and connect with a teammate in real-time.",
    },
    {
      id: 2,
      icon: "🧠",
      title: "Answer Partner",
      description: "Exchange and answer your partner's custom questions.",
    },
    {
      id: 3,
      icon: "📸",
      title: "Take a Selfie",
      description: "Snap a photo together with your partner to complete the connection!",
    },
  ];

  return (
    <Box
      sx={{
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <GameHeader />

      {/* Game Board Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          bgcolor: "primary.main",
          position: "relative",
          overflow: "hidden",
          gap: 0,
          p: 2,
          minHeight: "450px",
        }}
      >
        {/* Left Side - Game Path */}
        <Box
          sx={{
            maxWidth: "120px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              mb: 2,
              fontSize: "16px",
              textWrap: "nowrap",
            }}
          >
            Connection Flow
          </Typography>

          {/* Vertical Path */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              minHeight: "300px",
            }}
          >
            {/* Path Line */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "10%",
                bottom: "10%",
                width: "3px",
                bgcolor: "rgba(255,255,255,0.4)",
                transform: "translateX(-50%)",
              }}
            />

            {/* Game Steps */}
            {gameSteps.map((step, index) => {
              const isActive = currentStep === index;
              const isViewed = viewedSteps.has(index);

              return (
                <Box
                  key={step.id}
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => handleStepClick(index)}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      border: "2px solid white",
                      bgcolor: isActive
                        ? "#FFFFFF"
                        : isViewed
                        ? "#4FD1C5"
                        : "rgba(255,255,255,0.3)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    {step.icon}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Right Side - Step Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              bgcolor: "white",
              borderRadius: 2,
              width: "100%",
              maxWidth: "280px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {gameSteps[currentStep].title}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: "14px",
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              {gameSteps[currentStep].description}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Bottom Section */}
      <Box
        sx={{
          width: "100%",
          bgcolor: "white",
          py: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Show Back/Next buttons or Jump In button */}
        {allStepsViewed ? (
          <GlobalButton
            onClick={handleJumpIn}
            sx={{
              maxWidth: "300px",
            }}
          >
            Jump in
          </GlobalButton>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              width: "100%",
              maxWidth: "300px",
              justifyContent: "space-between",
            }}
          >
            <GlobalButton
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              sx={{
                flex: 1,
                maxWidth: "120px",
                opacity: currentStep === 0 ? 0.5 : 1,
              }}
            >
              Back
            </GlobalButton>

            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                color: "text.secondary",
              }}
            >
              {currentStep + 1} of 4
            </Typography>

            <GlobalButton
              onClick={handleNextStep}
              disabled={currentStep === 3}
              sx={{
                flex: 1,
                maxWidth: "120px",
                opacity: currentStep === 3 ? 0.5 : 1,
              }}
            >
              Next
            </GlobalButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default V2IntroScreen;
