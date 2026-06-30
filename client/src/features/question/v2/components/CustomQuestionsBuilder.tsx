import React, { useState } from "react";
import { Box, Typography, TextField, IconButton, Paper, Button } from "@mui/material";
import { Add, Delete, Save } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAddCustomQuestionsMutation } from "../../../game/services/gameArena.Api";
import GameHeader from "../../../../components/layout/GameHeader";
import GlobalButton from "../../../../components/ui/button";

interface QuestionInput {
  questionText: string;
  correctAnswer: string;
}

const CustomQuestionsBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [addCustomQuestions, { isLoading }] = useAddCustomQuestionsMutation();
  
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { questionText: "", correctAnswer: "" }
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { questionText: "", correctAnswer: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleChangeQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Validate: At least 1 question must have text
    const filledQuestions = questions.filter((q) => q.questionText.trim().length > 0);
    
    if (filledQuestions.length === 0) {
      setErrorMsg("Please fill out at least one question before submitting.");
      return;
    }

    try {
      await addCustomQuestions({
        questions: filledQuestions.map((q) => ({
          questionText: q.questionText.trim(),
          correctAnswer: q.correctAnswer.trim() || undefined,
        }))
      }).unwrap();

      // Clear local answers cache if any
      const STORAGE_KEY = `questionnaire_answers_v2_${sessionId}`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filledQuestions));
      
      navigate(`/game/${sessionId}/waiting`);
    } catch (err: any) {
      console.error("Failed to submit custom questions:", err);
      setErrorMsg(err?.data?.message || "Failed to submit questions. Please try again.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f5f6fa" }}>
      <GameHeader />
      
      {/* Banner Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          p: 4,
          pb: 8,
          textAlign: "center",
          backgroundImage: "#A78BFA",
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Create Your Questions!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 1, color:"#E5E4E2" }}>
          Write fun facts or trivia questions about yourself for another player to answer.
        </Typography>
      </Box>

      {/* Questions List Container */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          mt: -5,
          pb: 12,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center"
        }}
      >
        {questions.map((question, index) => (
          <Paper
            key={index}
            elevation={2}
            sx={{
              p: 3,
              width: "100%",
              maxWidth: "400px",
              position: "relative",
              // borderLeft: "5px solid #4FD1C5"
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                Question #{index + 1}
              </Typography>
              {questions.length > 1 && (
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveQuestion(index)}
                  sx={{ p: 0.5 }}
                >
                  <Delete size-sm />
                </IconButton>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              label="The Question"
              placeholder="e.g. What is my secret hobby or talent?"
              value={question.questionText}
              onChange={(e) => handleChangeQuestion(index, "questionText", e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Private Answer (Optional)"
              placeholder="e.g. Playing the Ukulele"
              value={question.correctAnswer}
              onChange={(e) => handleChangeQuestion(index, "correctAnswer", e.target.value)}
              // helperText="This answer is kept private and not shown to guests."
              inputProps={{ maxLength: 100 }}
            />
          </Paper>
        ))}

        {/* Add Question Button */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAddQuestion}
          startIcon={<Add />}
          sx={{
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
            "&:hover": { transform: "scale(1.02)" }
          }}
        >
          Add new question
        </Button>

        {errorMsg && (
          <Typography color="error" variant="body2" textAlign="center" sx={{ maxWidth: 300 }}>
            {errorMsg}
          </Typography>
        )}
      </Box>

      {/* Sticky Bottom Submit Button */}
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
          zIndex: 10
        }}
      >
        <GlobalButton
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          sx={{ maxWidth: "400px" }}
          startIcon={<Save />}
        >
          {isLoading ? "Saving..." : "Submit Questions"}
        </GlobalButton>
      </Box>
    </Box>
  );
};

export default CustomQuestionsBuilder;
