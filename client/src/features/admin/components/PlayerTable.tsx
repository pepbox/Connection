import { Clear as ClearIcon, Quiz as QuizIcon } from "@mui/icons-material";
import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { PlayerTableProps } from "../types/interfaces";
import { useUpdateSessionMutation } from "../services/admin.Api";
import { useAppSelector } from "../../../app/rootReducer";
import { RootState } from "../../../app/store";

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (player: any) => React.ReactNode;
};

const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  customQuestionsCount = 2,
}) => {
  const totalJoined = players?.length || 0;
  // const pendingCount = players?.filter(
  //   (player) => (player.v2?.customQuestionsCreated || 0) < (customQuestionsCount || 2)
  // ).length || 0;

  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query state
  
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  const [updateSession] = useUpdateSessionMutation();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionCountInput, setQuestionCountInput] = useState<number>(customQuestionsCount || 2);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setQuestionCountInput(customQuestionsCount || 2);
  }, [customQuestionsCount]);

  const handleSaveQuestionCount = async () => {
    if (!sessionId) return;
    setIsUpdating(true);
    try {
      await updateSession({ sessionId, customQuestionsCount: Number(questionCountInput) }).unwrap();
      setIsQuestionModalOpen(false);
    } catch (err) {
      console.error("Failed to update question count:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter players by search query if provided
  const filteredPlayers = React.useMemo(() => {
    let filtered = players || [];

    // Filter by search query if provided
    if (searchQuery.trim()) {
      filtered = filtered.filter((player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    return filtered;
  }, [players, searchQuery]);

  const sortedPlayers = React.useMemo(() => {
    if (!sortField || !filteredPlayers) return filteredPlayers;

    return [...filteredPlayers].sort((a, b) => {
      let aValue = (a as any)[sortField];
      let bValue = (b as any)[sortField];

      // Handle nested v2 values for sorting if applicable
      if (sortField === "customQuestionsCreated") {
        aValue = a.v2?.customQuestionsCreated || 0;
        bValue = b.v2?.customQuestionsCreated || 0;
      } else if (sortField === "connectedTeammatesCount") {
        aValue = a.v2?.connectedTeammatesCount || 0;
        bValue = b.v2?.connectedTeammatesCount || 0;
      } else if (sortField === "customAnswersSubmitted") {
        aValue = a.v2?.customAnswersSubmitted || 0;
        bValue = b.v2?.customAnswersSubmitted || 0;
      } else if (sortField === "selfieUploaded") {
        aValue = a.v2?.selfieUploaded ? 1 : 0;
        bValue = b.v2?.selfieUploaded ? 1 : 0;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle mixed or undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Convert to string for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredPlayers, sortField, sortDirection]);

  const v2Columns: Column[] = [
    {
      key: "name",
      label: "Player Name",
      sortable: true,
      render: (player) => player.name,
    },
    {
      key: "customQuestionsCreated",
      label: "Questions Written",
      sortable: true,
      render: (player) => {
        const count = player.v2?.customQuestionsCreated || 0;
        return (
          <Chip
            label={count > 0 ? `${count} written` : "Pending"}
            size="small"
            color={count > 0 ? "success" : "warning"}
            variant="outlined"
          />
        );
      },
    },
    {
      key: "connectedTeammatesCount",
      label: "No. of Connected Teammates",
      sortable: true,
      render: (player) => {
        const count = player.v2?.connectedTeammatesCount || 0;
        return (
          <Typography
            variant="body2"
            fontWeight={count > 0 ? "bold" : "regular"}
          >
            {count}
          </Typography>
        );
      },
    },
    {
      key: "customAnswersSubmitted",
      label: "No. of Questions Answered",
      sortable: true,
      render: (player) => {
        const count = player.v2?.customAnswersSubmitted || 0;
        return (
          <Chip
            label={count > 0 ? `${count} answered` : "Pending"}
            size="small"
            color={count > 0 ? "success" : "warning"}
            variant="outlined"
          />
        );
      },
    },
    {
      key: "selfieUploaded",
      label: "Connection Selfie",
      sortable: true,
      render: (player) => {
        const uploaded = player.v2?.selfieUploaded || false;
        return (
          <Chip
            label={uploaded ? "Uploaded" : "Pending"}
            size="small"
            color={uploaded ? "success" : "warning"}
          />
        );
      },
    },
  ];

  const getRowColor = (index: number) =>
    index % 2 === 0 ? "#11111108" : "#11111100";

  return (
    <>
      {/* Search Filter & Status Summary */}
      <Box
        mb={2}
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "space-between" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search players by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: 200,
              maxWidth: 300,
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "8px",
                fontFamily: '"Josefin Sans", sans-serif',
              },
            }}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: "text.secondary", fontSize: "0.9rem" }}>🔍</Box>
              ),
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`Joined: ${totalJoined}`}
              sx={{
                fontFamily: '"Josefin Sans", sans-serif',
                fontWeight: 700,
                backgroundColor: "rgba(79, 209, 197, 0.15)",
                color: "#319795",
                borderRadius: "8px",
                height: "40px",
                fontSize: "0.875rem",
                px: 1,
              }}
            />
            {/* <Chip
              label={`Pending: ${pendingCount}`}
              sx={{
                fontFamily: '"Josefin Sans", sans-serif',
                fontWeight: 700,
                backgroundColor: pendingCount > 0 ? "rgba(252, 166, 30, 0.15)" : "rgba(72, 187, 120, 0.15)",
                color: pendingCount > 0 ? "#d69e2e" : "#38a169",
                borderRadius: "8px",
                height: "40px",
                fontSize: "0.875rem",
                px: 1,
              }}
            /> */}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {/* Configure Required Questions Count Button */}
          <Button
          variant="contained"
          startIcon={<QuizIcon />}
          onClick={() => {
            setQuestionCountInput(customQuestionsCount || 2);
            setIsQuestionModalOpen(true);
          }}
          sx={{
            height: "40px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            backgroundColor: "secondary.main",
            color: "secondary.contrastText",
            px: 2,
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            fontFamily: '"Josefin Sans", sans-serif',
            boxShadow: "0 2px 6px rgba(255, 207, 37, 0.3)",
            "&:hover": {
              backgroundColor: "secondary.dark",
              boxShadow: "0 4px 12px rgba(255, 207, 37, 0.4)",
            },
          }}
        >
          Set Questions ({customQuestionsCount || 2})
        </Button>
        {searchQuery && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={() => {
              setSearchQuery("");
            }}
            sx={{
              color: "text.secondary",
              borderColor: "text.secondary",
              padding: "6px 8px",
              "&:hover": {
                backgroundColor: "action.hover",
                borderColor: "text.primary",
                color: "text.primary",
              },
            }}
          >
            Clear Search
          </Button>
        )}
        {/* Filter Status Info */}
        {searchQuery && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredPlayers?.length || 0} players matching "{searchQuery}"
            </Typography>
          </Box>
        )}
        </Box>
      </Box>

      {!isMobile && (
        <Box mb={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontStyle: "normal",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize:"16px",
              fontFamily:"Josefin Sans",
              fontWeight:400
            }}
          >
            💡 Click on column headers to sort the table
          </Typography>
        </Box>
      )}
      {isMobile ? (
        <Stack spacing={2}>
          {sortedPlayers?.map((player, index) => (
            <Paper
              key={player.id}
              elevation={0}
              sx={{
                borderRadius: 2,
                backgroundColor: getRowColor(index),
                p: 2,
              }}
            >
              {v2Columns.map((col, colIdx) => (
                <Box
                  key={col.key}
                  mb={colIdx < v2Columns.length - 1 ? 1.5 : 0}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {col.label}
                  </Typography>
                  <Box mt={0.5}>
                    {col.render(player)}
                  </Box>
                  {colIdx < v2Columns.length - 1 && (
                    <Divider sx={{ my: 1 }} />
                  )}
                </Box>
              ))}
            </Paper>
          ))}
        </Stack>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, overflow: "hidden" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {v2Columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: "bold" }}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortField === col.key}
                        direction={
                          sortField === col.key ? sortDirection : "asc"
                        }
                        onClick={() => handleSort(col.key)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            color: "primary.main",
                          },
                          "&.Mui-active": {
                            color: "primary.main",
                            fontWeight: "bold",
                          },
                          "& .MuiTableSortLabel-icon": {
                            opacity: sortField === col.key ? 1 : 0.5,
                          },
                          "&:hover .MuiTableSortLabel-icon": {
                            opacity: 1,
                          },
                        }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers?.map((player, index) => (
                <TableRow
                  key={player.id}
                  sx={{ backgroundColor: getRowColor(index) }}
                >
                  {v2Columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render(player)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Question Count Settings Modal */}
      <Dialog
        open={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800, pb: 1 }}>
          Set Required Questions Count
        </DialogTitle>
        <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Josefin Sans", sans-serif' }}>
            Specify how many custom questions each player must create during their game setup.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Required Questions per Player"
            variant="outlined"
            size="small"
            value={questionCountInput}
            onChange={(e) => setQuestionCountInput(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 10 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
              "& .MuiInputLabel-root": {
                fontFamily: '"Josefin Sans", sans-serif',
              },
              "& .MuiOutlinedInput-input": { fontFamily: '"Josefin Sans", sans-serif' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsQuestionModalOpen(false)}
            sx={{ fontFamily: '"Josefin Sans", sans-serif', textTransform: "none", color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuestionCount}
            disabled={isUpdating}
            startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              fontFamily: '"Josefin Sans", sans-serif',
              textTransform: "none",
              backgroundColor: "secondary.main",
              color: "secondary.contrastText",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "secondary.dark" }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlayerTable;
