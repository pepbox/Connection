import React, { useState } from "react";
import { Box, Typography, Paper, Avatar, CircularProgress, IconButton, Collapse } from "@mui/material";
import { ExpandMore, ExpandLess, CheckCircle } from "@mui/icons-material";
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
          Review your past connections and the answers you exchanged.
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
                        sx={{ width: 50, height: 50, border: "2px solid", borderColor: "primary.main" }}
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
                      {/* Questions Exchanged */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: "primary.main" }} fontWeight="bold" mb={2}>
                          Questions Exchanged & Discussed
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                          {conn.partnerQuestions?.map((q: any) => (
                            <Box
                              key={q._id}
                              sx={{
                                p: 2,
                                bgcolor: "rgba(239, 51, 73, 0.05)",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                {conn.partner?.name}'s Question: {q.questionText}
                              </Typography>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  mt: 1,
                                  px: 1.25,
                                  py: 0.5,
                                  borderRadius: "6px",
                                  bgcolor: "rgba(46, 125, 50, 0.08)",
                                  border: "1px solid rgba(46, 125, 50, 0.2)",
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 14, color: "#2e7d32" }} />
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#2e7d32",
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: "0.01em",
                                  }}
                                >
                                  Discussed & Answered Verbally
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                          {conn.myQuestions?.map((q: any) => (
                            <Box
                              key={q._id}
                              sx={{
                                p: 2,
                                bgcolor: "rgba(253, 140, 67, 0.05)",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                Your Question: {q.questionText}
                              </Typography>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  mt: 1,
                                  px: 1.25,
                                  py: 0.5,
                                  borderRadius: "6px",
                                  bgcolor: "rgba(46, 125, 50, 0.08)",
                                  border: "1px solid rgba(46, 125, 50, 0.2)",
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 14, color: "#2e7d32" }} />
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#2e7d32",
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: "0.01em",
                                  }}
                                >
                                  Discussed & Answered Verbally
                                </Typography>
                              </Box>
                            </Box>
                          ))}
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
