import { Clear as ClearIcon } from "@mui/icons-material";
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
} from "@mui/material";
import React, { useState } from "react";
import { PlayerTableProps } from "../types/interfaces";

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (player: any) => React.ReactNode;
};

const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
}) => {
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query state

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
      } else if (sortField === "partnerName") {
        aValue = a.v2?.partnerName || "";
        bValue = b.v2?.partnerName || "";
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
      key: "partnerName",
      label: "Connected Teammate",
      sortable: true,
      render: (player) => {
        const partner = player.v2?.partnerName || "None";
        return (
          <Typography
            variant="body2"
            fontWeight={
              partner !== "None" && partner !== "Pending connection"
                ? "bold"
                : "regular"
            }
          >
            {partner}
          </Typography>
        );
      },
    },
    {
      key: "customAnswersSubmitted",
      label: "Teammate's Questions Answered",
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
      {/* Search Filter */}
      <Box
        mb={2}
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        <TextField
          size="small"
          placeholder="Search players by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, color: "text.secondary" }}>🔍</Box>
            ),
          }}
        />
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
    </>
  );
};

export default PlayerTable;
