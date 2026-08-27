import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useSubmitCustomAnswersMutation } from "../../services/gameArena.Api";
import GlobalButton from "../../../../components/ui/button";

interface QuestionExchangeHubProps {
  connectionId: string;
  partnerQuestions: Array<{ _id: string; questionText: string }>;
  partnerName: string;
  partnerProfilePhoto?: string;
}

const QuestionExchangeHub: React.FC<QuestionExchangeHubProps> = ({
  connectionId,
  partnerQuestions,
  partnerName,
  partnerProfilePhoto,
}) => {
  const [submitAnswers, { isLoading }] = useSubmitCustomAnswersMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);

    const formattedAnswers = partnerQuestions.length > 0
      ? partnerQuestions.map((q) => ({
          questionId: q._id,
          answer: "Discussed Verbally",
        }))
      : [{ questionId: "verbal_discussion", answer: "Discussed Verbally" }];

    try {
      await submitAnswers({
        connectionId,
        answers: formattedAnswers,
      }).unwrap();
    } catch (err: any) {
      console.error("Failed to submit confirmation:", err);
      setErrorMsg(err?.data?.message || "Failed to confirm. Please try again.");
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      {/* Partner Banner Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(135deg, #ef3349 0%, #ff7c27 100%)",
          color: "white",
          borderRadius: 3,
          p: 3,
          boxShadow: "0 8px 32px 0 rgba(239, 51, 73, 0.2)",
          textAlign: "center",
        }}
      >
        <Avatar
          src={partnerProfilePhoto}
          alt={partnerName}
          sx={{
            width: 70,
            height: 70,
            mb: 1.5,
            border: "3px solid white",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          }}
        />
        <Typography variant="h5" fontWeight="800" gutterBottom sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
          Connected with {partnerName}!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: "500", fontFamily: '"Josefin Sans", sans-serif' }}>
          Exchange the question and answer in-person
        </Typography>
      </Box>

      {/* Questions List */}
      <Box display="flex" flexDirection="column" gap={2}>
        {partnerQuestions.map((q, index) => (
          <Paper
            key={q._id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #f0f0f0",
              bgcolor: "#fcfcfa",
              boxShadow: "0 4px 20px 0 rgba(0,0,0,0.02)",
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" color="secondary.main" gutterBottom>
              Question {index + 1} from {partnerName}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {q.questionText}
            </Typography>
          </Paper>
        ))}
      </Box>

      {errorMsg && (
        <Typography color="error" variant="body2" textAlign="center" sx={{ mt: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {/* Submit Confirmation Action */}
      <Box
        sx={{
          mt: 1,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <GlobalButton
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          sx={{ maxWidth: "400px", py: 1.5, fontSize: "1rem" }}
          startIcon={<CheckCircle />}
        >
          {isLoading ? "Confirming..." : "Done Discussing — Ready for Selfie"}
        </GlobalButton>
      </Box>
    </Box>
  );
};

export default QuestionExchangeHub;
