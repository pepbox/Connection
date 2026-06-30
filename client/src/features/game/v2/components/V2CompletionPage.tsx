import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
} from "@mui/material";
import { Celebration, Quiz, EmojiEmotions } from "@mui/icons-material";
import { motion } from "framer-motion";
import GlobalButton from "../../../../components/ui/button";

interface V2CompletionPageProps {
  onGoHome: () => void;
  data: {
    partner: {
      name: string;
      profilePhoto?: string;
    };
    selfieUrl?: string;
    partnerSelfieUrl?: string;
    myQuestions: Array<{ _id: string; questionText: string }>;
    partnerQuestions: Array<{ _id: string; questionText: string }>;
    myAnswers: Array<{ questionId: string; answer: string }>;
    partnerAnswers: Array<{ questionId: string; answer: string }>;
  };
}

const V2CompletionPage: React.FC<V2CompletionPageProps> = ({ data, onGoHome }) => {
  const {
    partner,
    selfieUrl,
    partnerSelfieUrl,
    myQuestions,
    partnerQuestions,
    myAnswers,
    partnerAnswers,
  } = data;

  const getAnswerForQuestion = (
    questionId: string,
    answersList: Array<{ questionId: string; answer: string }>
  ) => {
    const matched = answersList.find((a) => a.questionId === questionId);
    return matched ? matched.answer : "No answer provided";
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3, pb: 6 }}>
      {/* Celebration Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            bgcolor: "primary.main",
            backgroundImage: "linear-gradient(135deg, #4FD1C5 0%, #3AB5A8 100%)",
            color: "white",
            borderRadius: "16px",
            p: 4,
            boxShadow: "0px 8px 30px rgba(79, 209, 197, 0.2)",
            position: "relative",
          }}
        >
          <Celebration sx={{ fontSize: 60, mb: 1, color: "#FEF3C7" }} />
          <Typography variant="h4" fontWeight="800">
            Connected!
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.95, fontWeight: "500" }}>
            You and {partner.name} have successfully bonded!
          </Typography>
        </Box>
      </motion.div>

      {/* Selfie Photos Grid */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2} textAlign="center">
          📷 Your Connection Selfies
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {selfieUrl === partnerSelfieUrl && selfieUrl ? (
            <Grid size={{ xs: 12, sm: 8 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Box
                  component="img"
                  src={selfieUrl}
                  alt="Shared Connection Selfie"
                  sx={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "3px solid #4FD1C5",
                  }}
                />
                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                  Connection Selfie
                </Typography>
              </Box>
            </Grid>
          ) : (
            <>
              {selfieUrl && (
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Box
                      component="img"
                      src={selfieUrl}
                      alt="My uploaded selfie"
                      sx={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "2px solid #4FD1C5",
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      Your Selfie
                    </Typography>
                  </Box>
                </Grid>
              )}
              {partnerSelfieUrl && (
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Box
                      component="img"
                      src={partnerSelfieUrl}
                      alt="Partner's uploaded selfie"
                      sx={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "2px solid #A78BFA",
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      {partner.name}'s Selfie
                    </Typography>
                  </Box>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Paper>

      {/* Custom Questions Exchange Summary */}
      <Paper elevation={1} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Answers to Partner Questions */}
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#2C7A7B" }} display="flex" alignItems="center" gap={1} mb={2}>
            <Quiz /> Your Answers to {partner.name}'s Questions
          </Typography>
          {partnerQuestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No questions exchanged.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {partnerQuestions.map((q) => (
                <Box
                  key={q._id}
                  sx={{
                    p: 2,
                    bgcolor: "rgba(79, 209, 197, 0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    Q: {q.questionText}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: "500" }}>
                    A: {getAnswerForQuestion(q._id, myAnswers)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        {/* Partner Answers to My Questions */}
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#6B46C1" }} display="flex" alignItems="center" gap={1} mb={2}>
            <EmojiEmotions /> {partner.name}'s Answers to Your Questions
          </Typography>
          {myQuestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No questions written.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {myQuestions.map((q) => (
                <Box
                  key={q._id}
                  sx={{
                    p: 2,
                    bgcolor: "rgba(167, 139, 250, 0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    Q: {q.questionText}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: "500" }}>
                    A: {getAnswerForQuestion(q._id, partnerAnswers)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Box display="flex" justifyContent="center" mt={2}>
        <GlobalButton onClick={onGoHome} sx={{ width: '100%', maxWidth: 400 }}>
          Find Another Teammate
        </GlobalButton>
      </Box>
    </Box>
  );
};

export default V2CompletionPage;
