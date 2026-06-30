import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Avatar,
  Divider,
} from "@mui/material";
import { Send, Quiz } from "@mui/icons-material";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmit = async () => {
    // Validate that all questions have been answered
    const unanswered = partnerQuestions.filter(
      (q) => !answers[q._id] || answers[q._id].trim().length === 0
    );

    if (unanswered.length > 0) {
      setErrorMsg("Please answer all of your partner's questions before submitting.");
      return;
    }

    setErrorMsg(null);

    const formattedAnswers = partnerQuestions.map((q) => ({
      questionId: q._id,
      answer: answers[q._id].trim(),
    }));

    try {
      await submitAnswers({
        connectionId,
        answers: formattedAnswers,
      }).unwrap();
    } catch (err: any) {
      console.error("Failed to submit answers:", err);
      setErrorMsg(err?.data?.message || "Failed to submit answers. Please try again.");
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3, pb: 10 }}>
      {/* Partner Banner Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "primary.main",
          backgroundImage: "linear-gradient(135deg, #A78BFA 0%, #764ba2 100%)",
          color: "white",
          borderRadius: "16px",
          p: 3,
          boxShadow: "0px 4px 20px rgba(167, 139, 250, 0.2)",
          position: "relative",
          mb: 1,
        }}
      >
        <Avatar
          src={partnerProfilePhoto}
          alt={partnerName}
          sx={{
            width: 80,
            height: 80,
            border: "4px solid white",
            boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
            mb: 2,
          }}
        />
        <Typography variant="h5" fontWeight="bold">
          Get to Know {partnerName}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, textAlign: "center", mt: 0.5 }}>
          Answer their custom questions below to exchange facts!
        </Typography>
      </Box>

      {/* Questions List */}
      <Box display="flex" flexDirection="column" gap={3}>
        {partnerQuestions.map((q, index) => (
          <Paper
            key={q._id}
            elevation={2}
            sx={{
              p: 3,
              borderLeft: "6px solid #4FD1C5",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Quiz color="secondary" />
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                Question {index + 1} of {partnerQuestions.length}
              </Typography>
            </Box>

            <Typography
              variant="body1"
              fontWeight="500"
              color="text.primary"
              sx={{ mb: 2, fontSize: "17px", lineHeight: 1.5 }}
            >
              {q.questionText}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              label="Your Answer"
              placeholder="Type your answer here..."
              value={answers[q._id] || ""}
              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
              inputProps={{ maxLength: 150 }}
            />
          </Paper>
        ))}
      </Box>

      {errorMsg && (
        <Typography color="error" variant="body2" textAlign="center" sx={{ mt: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {/* Sticky Bottom Actions */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "white",
          borderTop: "1px solid #e0e0e0",
          py: 2,
          px: 4,
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <GlobalButton
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          sx={{ maxWidth: "400px" }}
          startIcon={<Send />}
        >
          {isLoading ? "Submitting..." : "Submit Answers"}
        </GlobalButton>
      </Box>
    </Box>
  );
};

export default QuestionExchangeHub;
