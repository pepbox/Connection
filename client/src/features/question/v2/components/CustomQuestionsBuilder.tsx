import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Paper } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAddCustomQuestionsMutation, useGetSessionQuery } from "../../../game/services/gameArena.Api";
import GameHeader from "../../../../components/layout/GameHeader";
import GlobalButton from "../../../../components/ui/button";

interface QuestionInput {
  questionText: string;
  correctAnswer: string;
}

const CustomQuestionsBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: sessionData } = useGetSessionQuery(sessionId, { skip: !sessionId });
  const requiredCount = sessionData?.customQuestionsCount || 2;

  const [addCustomQuestions, { isLoading }] = useAddCustomQuestionsMutation();
  
  const [questions, setQuestions] = useState<QuestionInput[]>(() =>
    Array.from({ length: requiredCount }, () => ({ questionText: "", correctAnswer: "" }))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (requiredCount && questions.length !== requiredCount) {
      setQuestions((prev) => {
        if (prev.length < requiredCount) {
          const added = Array.from({ length: requiredCount - prev.length }, () => ({
            questionText: "",
            correctAnswer: "",
          }));
          return [...prev, ...added];
        }
        return prev.slice(0, requiredCount);
      });
    }
  }, [requiredCount]);

  const handleChangeQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async () => {
    // Validate: All required questions must have questionText filled
    const invalidQuestion = questions.find((q) => q.questionText.trim().length === 0);
    
    if (invalidQuestion || questions.length !== requiredCount) {
      setErrorMsg(`Please fill out all ${requiredCount} question(s) before submitting.`);
      return;
    }

    try {
      await addCustomQuestions({
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          correctAnswer: q.correctAnswer.trim() || undefined,
        }))
      }).unwrap();

      // Clear local answers cache if any
      const STORAGE_KEY = `questionnaire_answers_v2_${sessionId}`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
      
      navigate(`/game/${sessionId}/waiting`);
    } catch (err: any) {
      console.error("Failed to submit custom questions:", err);
      setErrorMsg(err?.data?.message || "Failed to submit questions. Please try again.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fffdf0" }}>
      <GameHeader />
      
      {/* Banner Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #ef3349 0%, #ff7c27 100%)",
          color: "white",
          p: 4,
          pb: 8,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={1} sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
          Create Your Questions!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, color: "white", fontFamily: '"Josefin Sans", sans-serif' }}>
          Write {requiredCount} fun facts or trivia questions about yourself for another player to answer.
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
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                Question #{index + 1}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              label={`The Question #${index + 1}`}
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
              inputProps={{ maxLength: 100 }}
            />
          </Paper>
        ))}

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
