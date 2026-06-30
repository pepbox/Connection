import React, { useState } from "react";
import { Box, Typography, Paper, Avatar, CircularProgress, IconButton, Collapse } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useGetConnectionHistoryQuery } from "../../services/gameArena.Api";
import GameHeader from "../../../../components/layout/GameHeader";

const V2HistoryPage: React.FC = () => {
  const { data: history = [], isLoading } = useGetConnectionHistoryQuery();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <GameHeader />
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress color="primary" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", pb: 10 }}>
      <GameHeader />
      <Box sx={{ p: 2, flex: 1 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: "primary.main", mb: 1, textAlign: "center" }}>
          Connection History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
          Review your past teammates and the answers you exchanged.
        </Typography>

        {history.length === 0 ? (
          <Typography variant="body1" textAlign="center" color="text.secondary">
            You haven't completed any connections yet.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {history.map((conn) => {
              const isExpanded = expandedId === conn.connectionId;
              const time = new Date(conn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Paper
                  key={conn.connectionId}
                  elevation={1}
                  sx={{
                    borderRadius: 4,
                    p: 2,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={conn.partner?.profilePhoto}
                        alt={conn.partner?.name}
                        sx={{ width: 50, height: 50, border: "2px solid #4FD1C5" }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                          {conn.partner?.name || "Unknown"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Connected at {time}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton onClick={() => setExpandedId(isExpanded ? null : conn.connectionId)}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded} unmountOnExit>
                    <Box mt={3} display="flex" flexDirection="column" gap={3}>
                      {/* Your Responses */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: "#2C7A7B" }} fontWeight="bold" mb={2}>
                          Your Responses
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                          {conn.myAnswers?.map((ans: any) => {
                            const question = conn.partnerQuestions?.find((q: any) => q._id === ans.questionId);
                            return (
                              <Box
                                key={ans.questionId}
                                sx={{
                                  p: 2,
                                  bgcolor: "rgba(79, 209, 197, 0.05)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                  Q: {question?.questionText || "Unknown Question"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: "500" }}>
                                  A: {ans.answer}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>

                      {/* Partner Responses */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: "#6B46C1" }} fontWeight="bold" mb={2}>
                          {conn.partner?.name}'s Responses
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                          {conn.partnerAnswers?.map((ans: any) => {
                            const question = conn.myQuestions?.find((q: any) => q._id === ans.questionId);
                            return (
                              <Box
                                key={ans.questionId}
                                sx={{
                                  p: 2,
                                  bgcolor: "rgba(167, 139, 250, 0.05)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                  Q: {question?.questionText || "Unknown Question"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: "500" }}>
                                  A: {ans.answer}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default V2HistoryPage;
