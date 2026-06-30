import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Snackbar,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import GlobalButton from "../../../components/ui/button";
import { setPlayer } from "../services/player.slice";
import { RootState } from "../../../app/store";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import homescreenLottie from "../../../assets/LogInPage-animation.lottie";

const HomeScreen: React.FC = () => {
  const { isAuthenticated } = useAppSelector(
    (state: RootState) => state.player
  );
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [firstname, setFirstname] = React.useState<string>("");
  const [lastname, setLastname] = React.useState<string>("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const { sessionId } = useAppSelector((state: RootState) => state.game);

  const MAX_NAME_LENGTH = 20;

  // Validation function to check if input contains only letters and spaces
  const validateName = (name: string): string => {
    if (name.length > MAX_NAME_LENGTH) {
      return `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }
    if (!/^[a-zA-Z\s]*$/.test(name)) {
      return "Name can only contain letters and spaces";
    }
    return "";
  };

  const handleFirstnameChange = (value: string) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= MAX_NAME_LENGTH) {
      setFirstname(value);
    }
  };

  const handleLastnameChange = (value: string) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= MAX_NAME_LENGTH) {
      setLastname(value);
    }
  };

  const handleStart = () => {
    const firstnameValidation = validateName(firstname.trim());
    const lastnameValidation = validateName(lastname.trim());

    if (!firstname.trim() || !lastname.trim()) {
      setShowSnackbar(true);
      return;
    }

    if (firstnameValidation || lastnameValidation) {
      return;
    }

    const playerName = `${firstname.trim()} ${lastname.trim()}`;
    dispatch(
      setPlayer({
        name: playerName,
        teamNumber: 1,
      })
    );
    navigate(`/game/${sessionId}/capture`);
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  if (isAuthenticated) {
    return <Navigate to={`/game/${sessionId}/custom-questions`} replace />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#fffdf0", // Soft cream background
        px: 3,
        py: 4,
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: "#2d2b29",
          fontSize: { xs: "36px", sm: "48px" },
          textAlign: "center",
          fontFamily: '"Summary Notes", cursive',
          mb: 2,
        }}
      >
        Connections
      </Typography>

      <Box
        sx={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <DotLottieReact
          src={homescreenLottie}
          loop
          autoplay
          style={{ width: "100%", height: "100%", maxHeight: "260px" }}
        />
      </Box>

      {/* Styled onboarding card with red-orange gradient border */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "360px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, #ef3349 0%, #ff7c27 100%)",
          padding: "3px",
          boxShadow: "0px 8px 24px rgba(239, 51, 73, 0.15)",
        }}
      >
        <Box
          sx={{
            borderRadius: "21px",
            backgroundColor: "#ffffff",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              textAlign: "center",
              fontFamily: '"Josefin Sans", sans-serif',
              fontWeight: 700,
              color: "#2d2b29",
              mb: 0.5,
            }}
          >
            Enter Details
          </Typography>

          <TextField
            placeholder="First Name"
            variant="outlined"
            value={firstname}
            onChange={(e) => handleFirstnameChange(e.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "1.1rem",
                fontFamily: '"Montserrat Alternates", sans-serif',
                fontWeight: 500,
                height: "54px",
                borderRadius: "16px",
                color: "#2d2b29",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(45, 43, 41, 0.2)",
                  borderWidth: 1.5,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ef3349",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ef3349",
                  borderWidth: 2,
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                textAlign: "left",
              },
            }}
          />

          <TextField
            placeholder="Last Name"
            variant="outlined"
            value={lastname}
            onChange={(e) => handleLastnameChange(e.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "1.1rem",
                fontFamily: '"Montserrat Alternates", sans-serif',
                fontWeight: 500,
                height: "54px",
                borderRadius: "16px",
                color: "#2d2b29",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(45, 43, 41, 0.2)",
                  borderWidth: 1.5,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ef3349",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ef3349",
                  borderWidth: 2,
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                textAlign: "left",
              },
            }}
          />

          <Box sx={{ mt: 1 }}>
            <GlobalButton
              fullWidth
              onClick={handleStart}
              disabled={!firstname.trim() || !lastname.trim()}
              sx={{
                fontFamily: '"Montserrat Alternates", sans-serif',
                fontWeight: 600,
                fontSize: "1.2rem",
                borderRadius: "16px",
                height: "54px",
                minHeight: "54px",
              }}
            >
              Start Game
            </GlobalButton>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          sx={{ width: "100%" }}
        >
          Please enter both first and last names.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomeScreen;
