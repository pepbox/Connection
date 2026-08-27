import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAddCustomQuestionsMutation, useGetSessionQuery, useGetCustomQuestionsQuery } from "../../../game/services/gameArena.Api";
import GameHeader from "../../../../components/layout/GameHeader";
import GlobalButton from "../../../../components/ui/button";
import Loader from "../../../../components/ui/Loader";
import { useAppSelector } from "../../../../app/hooks";
import { RootState } from "../../../../app/store";

interface QuestionInput {
  questionText: string;
}

const CustomQuestionsBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: sessionData } = useGetSessionQuery(sessionId, { skip: !sessionId });
  const requiredCount = sessionData?.customQuestionsCount || 1;

  const [addCustomQuestions, { isLoading }] = useAddCustomQuestionsMutation();
  
  // Fetch existing custom questions for route guarding
  const { data: existingQuestionsData, isLoading: isFetchingQuestions } = useGetCustomQuestionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isGameStarted = useAppSelector((state: RootState) => state.game.isGameStarted);

  const [questions, setQuestions] = useState<QuestionInput[]>(() =>
    Array.from({ length: requiredCount }, () => ({ questionText: "" }))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Guard redirect: once questions are written, block user from accessing this page
  useEffect(() => {
    if (!isFetchingQuestions && existingQuestionsData?.data && existingQuestionsData.data.length >= requiredCount) {
      if (isGameStarted) {
        navigate(`/game/${sessionId}/arena`, { replace: true });
      } else {
        navigate(`/game/${sessionId}/waiting`, { replace: true });
      }
    }
  }, [existingQuestionsData, isFetchingQuestions, requiredCount, isGameStarted, navigate, sessionId]);

  useEffect(() => {
    if (requiredCount && questions.length !== requiredCount) {
      setQuestions((prev) => {
        if (prev.length < requiredCount) {
          const added = Array.from({ length: requiredCount - prev.length }, () => ({
            questionText: "",
          }));
          return [...prev, ...added];
        }
        return prev.slice(0, requiredCount);
      });
    }
  }, [requiredCount]);

  const handleChangeQuestion = (index: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].questionText = value;
      return updated;
    });
    if (errorMsg) setErrorMsg(null);
  };

  const handlePreSubmit = () => {
    // Validate: All required questions must have questionText filled
    const invalidQuestion = questions.find((q) => q.questionText.trim().length === 0);
    
    if (invalidQuestion || questions.length !== requiredCount) {
      setErrorMsg(
        requiredCount > 1
          ? `Please fill out all ${requiredCount} questions before submitting.`
          : "Please fill out your question before submitting."
      );
      return;
    }

    setErrorMsg(null);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    try {
      await addCustomQuestions({
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
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

  if (isFetchingQuestions) {
    return <Loader />;
  }

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
          {requiredCount > 1 ? "Curate Your Questions!" : "Curate Your Question!"}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, color: "white", fontFamily: '"Josefin Sans", sans-serif' }}>
          {requiredCount > 1
            ? `Curate ${requiredCount} realistic questions about yourself.`
            : "Curate a realistic question about yourself."}
        </Typography>
      </Box>

      {/* Questions List Container */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          mt: -5,
          pb: 4,
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
              onChange={(e) => handleChangeQuestion(index, e.target.value)}
              inputProps={{ maxLength: 100 }}
            />
          </Paper>
        ))}

        {errorMsg && (
          <Typography color="error" variant="body2" textAlign="center" sx={{ maxWidth: 300 }}>
            {errorMsg}
          </Typography>
        )}

        {/* Submit Button right below the fields */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "400px",
            mt: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <GlobalButton
            fullWidth
            disabled={isLoading}
            onClick={handlePreSubmit}
            startIcon={<Save />}
          >
            {isLoading
              ? "Saving..."
              : requiredCount > 1
              ? "Submit Questions"
              : "Submit Question"}
          </GlobalButton>
        </Box>
      </Box>

      {/* Double verification dialog */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        aria-labelledby="confirm-submit-dialog-title"
        aria-describedby="confirm-submit-dialog-description"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "16px",
            p: 1.5,
          }
        }}
      >
        <DialogTitle id="confirm-submit-dialog-title" sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800 }}>
          Confirm Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-submit-dialog-description" sx={{ fontFamily: '"Josefin Sans", sans-serif', color: "text.secondary" }}>
            {requiredCount > 1
              ? "Are you sure you want to submit your custom questions? You won't be able to edit them after submitting."
              : "Are you sure you want to submit your custom question? You won't be able to edit it after submitting."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setIsConfirmOpen(false)}
            variant="outlined"
            sx={{
              borderColor: "text.primary",
              color: "text.primary",
              borderRadius: "12px",
              fontFamily: '"Josefin Sans", sans-serif',
              fontWeight: 600,
              px: 3,
              "&:hover": { borderColor: "text.primary", bgcolor: "rgba(0,0,0,0.04)" }
            }}
          >
            Cancel
          </Button>
          <GlobalButton
            onClick={handleSubmit}
            disabled={isLoading}
            fullWidth={false}
            sx={{
              borderRadius: "12px",
              px: 3,
            }}
          >
            Yes, Submit
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomQuestionsBuilder;
