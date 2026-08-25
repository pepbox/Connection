import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
} from "@mui/material";
import { Send } from "@mui/icons-material";
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
        <Typography variant="h5" fontWeight="800" gutterBottom>
          Partner Connected!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          You have connected with <strong>{partnerName}</strong>. Answer their question below to proceed!
        </Typography>
      </Box>

      {/* Questions List */}
      <Box display="flex" flexDirection="column" gap={3}>
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
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
              Question {index + 1}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
              {q.questionText}
            </Typography>

            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              Your Answer
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
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

      {/* Submit Action */}
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
