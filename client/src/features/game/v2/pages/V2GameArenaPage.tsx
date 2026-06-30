import React, { useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Avatar, Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import { HourglassEmpty, CameraAlt, Home, History } from "@mui/icons-material";
import { useGetConnectionStatusQuery } from "../../services/gameArena.Api";
import ConnectionHub from "../components/ConnectionHub";
import QuestionExchangeHub from "../components/QuestionExchangeHub";
import ConnectionSelfieScreen from "../components/ConnectionSelfieScreen";
import V2CompletionPage from "../components/V2CompletionPage";
import V2HistoryPage from "../components/V2HistoryPage";
import Loader from "../../../../components/ui/Loader";
import GameHeader from "../../../../components/layout/GameHeader";

const V2GameArenaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [ignoredCompletedIds, setIgnoredCompletedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("ignoredCompletedIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { data, isLoading, error } = useGetConnectionStatusQuery();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading connection status. Please try reloading the page.
        </Alert>
      </Box>
    );
  }

  const isConnectionCompleted = data?.status === "connected" && data?.selfieUploaded && data?.partnerSelfieUploaded;
  const isIgnored = data && ignoredCompletedIds.includes(data.connectionId);

  if (activeTab === "history") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <V2HistoryPage />
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <BottomNavigationAction label="Home" value="home" icon={<Home />} />
            <BottomNavigationAction label="History" value="history" icon={<History />} />
          </BottomNavigation>
        </Paper>
      </Box>
    );
  }

  // State: No connection request at all, or a recipient with a pending incoming request
  // (We render ConnectionHub for incoming so B can accept/decline)
  if (!data || (data.status === "pending" && data.role === "B") || (isConnectionCompleted && isIgnored)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", pb: 7 }}>
        <GameHeader />
        <ConnectionHub connectionStatus={(isConnectionCompleted && isIgnored) ? null : data} />
        
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <BottomNavigationAction label="Home" value="home" icon={<Home />} />
            <BottomNavigationAction label="History" value="history" icon={<History />} />
          </BottomNavigation>
        </Paper>
      </Box>
    );
  }

  // State: Sent a request, waiting for recipient B to accept
  if (data.status === "pending" && data.role === "A") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <GameHeader />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textAlign: "center",
          }}
        >
          <Card
            sx={{
              maxWidth: 400,
              width: "100%",
              borderRadius: 4,
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
              p: 3,
            }}
          >
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                <Typography variant="h5" fontWeight="800" color="primary.main">
                  Request Sent!
                </Typography>

                <Avatar
                  src={data.partner?.profilePhoto}
                  alt={data.partner?.name}
                  sx={{
                    width: 90,
                    height: 90,
                    border: "3px solid #4FD1C5",
                    boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
                  }}
                />

                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  Waiting for {data.partner?.name}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  We sent a connection request to your teammate. Once they accept, you'll exchange custom questions.
                </Typography>

                <Box display="flex" alignItems="center" gap={1.5} sx={{ color: "secondary.main", mt: 2 }}>
                  <CircularProgress size={20} color="secondary" />
                  <Typography variant="body2" fontWeight="bold">
                    Waiting for response...
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  // Status is "connected"
  if (data.status === "connected") {
    const hasIAnswered = data.myAnswers && data.myAnswers.length === (data.partnerQuestions?.length || 0);
    const hasPartnerAnswered = data.partnerAnswers && data.partnerAnswers.length === (data.myQuestions?.length || 0);

    // Sub-state 1: Player hasn't answered the partner's questions yet
    if (!hasIAnswered) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <GameHeader />
          <QuestionExchangeHub
            connectionId={data.connectionId}
            partnerQuestions={data.partnerQuestions}
            partnerName={data.partner.name}
            partnerProfilePhoto={data.partner.profilePhoto}
          />
        </Box>
      );
    }

    // Sub-state 2: Player answered, but partner has NOT answered yet
    if (hasIAnswered && !hasPartnerAnswered) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <GameHeader />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              textAlign: "center",
            }}
          >
            <Card
              sx={{
                maxWidth: 400,
                width: "100%",
                borderRadius: 4,
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                p: 3,
              }}
            >
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                  <HourglassEmpty sx={{ fontSize: 50, color: "secondary.main" }} />

                  <Typography variant="h5" fontWeight="800" color="primary.main">
                    Answers Submitted!
                  </Typography>

                  <Avatar
                    src={data.partner?.profilePhoto}
                    alt={data.partner?.name}
                    sx={{
                      width: 90,
                      height: 90,
                      border: "3px solid #4FD1C5",
                    }}
                  />

                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Waiting for {data.partner?.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    You've answered their questions. We are waiting for {data.partner?.name} to finish answering yours.
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1.5} sx={{ color: "secondary.main", mt: 2 }}>
                    <CircularProgress size={20} color="secondary" />
                    <Typography variant="body2" fontWeight="bold">
                      Waiting for teammate...
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      );
    }

    // Both answered. Sub-state 3: Player hasn't uploaded their selfie yet
    if (!data.selfieUploaded) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <GameHeader />
          <ConnectionSelfieScreen
            connectionId={data.connectionId}
            partnerName={data.partner.name}
            partnerProfilePhoto={data.partner.profilePhoto}
          />
        </Box>
      );
    }

    // Player uploaded selfie, but partner has NOT uploaded their selfie yet
    if (data.selfieUploaded && !data.partnerSelfieUploaded) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <GameHeader />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              textAlign: "center",
            }}
          >
            <Card
              sx={{
                maxWidth: 400,
                width: "100%",
                borderRadius: 4,
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                p: 3,
              }}
            >
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                  <CameraAlt sx={{ fontSize: 50, color: "secondary.main" }} />

                  <Typography variant="h5" fontWeight="800" color="primary.main">
                    Selfie Uploaded!
                  </Typography>

                  {data.selfieUrl && (
                    <Box
                      component="img"
                      src={data.selfieUrl}
                      alt="Your uploaded selfie"
                      sx={{
                        width: 140,
                        height: 140,
                        objectFit: "cover",
                        borderRadius: 3,
                        border: "3px solid #4FD1C5",
                      }}
                    />
                  )}

                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Waiting for {data.partner?.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    You've uploaded your selfie. Once {data.partner?.name} uploads theirs, your connection will be fully completed!
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1.5} sx={{ color: "secondary.main", mt: 2 }}>
                    <CircularProgress size={20} color="secondary" />
                    <Typography variant="body2" fontWeight="bold">
                      Waiting for partner selfie...
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      );
    }

    // Both answered and both uploaded selfies: render final completion screen
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <GameHeader />
        <V2CompletionPage 
          data={data}
          onGoHome={() => {
            setIgnoredCompletedIds((prev) => {
              const updated = [...prev, data.connectionId];
              sessionStorage.setItem("ignoredCompletedIds", JSON.stringify(updated));
              return updated;
            });
            setActiveTab("home");
          }}
        />
      </Box>
    );
  }

  // Fallback in case status doesn't match any state
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="info">Unknown connection state.</Alert>
    </Box>
  );
};

export default V2GameArenaPage;
