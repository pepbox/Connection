import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Grid,
} from "@mui/material";
import { Search, Check, Clear, } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetPlayersBySessionQuery,
  useSendConnectionRequestMutation,
  useRespondToConnectionRequestMutation,
} from "../../services/gameArena.Api";
import GlobalButton from "../../../../components/ui/button";

interface ConnectionHubProps {
  connectionStatus: any;
}

const ConnectionHub: React.FC<ConnectionHubProps> = ({ connectionStatus }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: players = [], isLoading: isLoadingPlayers } = useGetPlayersBySessionQuery();
  const [sendRequest, { isLoading: isSending }] = useSendConnectionRequestMutation();
  const [respondRequest, { isLoading: isResponding }] = useRespondToConnectionRequestMutation();
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  const handleConnect = async (recipientId: string) => {
    try {
      setLoadingPlayerId(recipientId);
      await sendRequest({ recipientId }).unwrap();
    } catch (error) {
      console.error("Failed to send connection request:", error);
    } finally {
      setLoadingPlayerId(null);
    }
  };

  const handleResponse = async (connectionId: string, action: "accept" | "reject") => {
    try {
      await respondRequest({ connectionId, action }).unwrap();
    } catch (error) {
      console.error(`Failed to ${action} connection request:`, error);
    }
  };

  const filteredPlayers = players.filter((player) =>
    player?.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const hasIncoming = connectionStatus?.status === "pending" && connectionStatus?.role === "B";

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Incoming Request Section */}
      <AnimatePresence>
        {hasIncoming && connectionStatus.partner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card
              sx={{
                background: "linear-gradient(135deg, #E2D8FD 0%, #C4B2FC 100%)",
                border: "2px solid #8B7ED8",
                boxShadow: "0 8px 32px rgba(167, 139, 250, 0.15)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={connectionStatus.partner.profilePhoto}
                    alt={connectionStatus.partner.name}
                    sx={{
                      width: 60,
                      height: 60,
                      border: "3px solid white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1C1C1E">
                      Connect Request!
                    </Typography>
                    <Typography variant="body2" color="#6b46c1" fontWeight="500">
                      {connectionStatus.partner.name} wants to partner up with you
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={2}>
                  <GlobalButton
                    onClick={() => handleResponse(connectionStatus.connectionId, "accept")}
                    disabled={isResponding}
                    sx={{
                      bgcolor: "secondary.main",
                      flex: 1,
                      "&:hover": { bgcolor: "secondary.dark" },
                    }}
                    startIcon={<Check />}
                  >
                    Accept
                  </GlobalButton>
                  <IconButton
                    onClick={() => handleResponse(connectionStatus.connectionId, "reject")}
                    disabled={isResponding}
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                      color: "error.main",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 2,
                      width: 48,
                      height: 48,
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                    }}
                  >
                    <Clear />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Stats */}
      <Box sx={{ textAlign: "center", mt: 1 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: "primary.main", mb: 1 }}>
          Find a Partner
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Search for a teammate, send a connection request, and solve custom questions together.
        </Typography>
      </Box>

      {/* Search Field */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search teammate by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          sx: {
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          },
        }}
      />

      {/* Teammates List */}
      <Box sx={{ flex: 1, minHeight: "200px" }}>
        {isLoadingPlayers ? (
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ py: 4 }}>
            Loading teammates...
          </Typography>
        ) : filteredPlayers.length === 0 ? (
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ py: 4 }}>
            No teammates found.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredPlayers.map((player) => {
              const isConnecting = loadingPlayerId === player._id;

              return (
                <Grid size={{ xs: 12 }} key={player._id}>
                  <Card
                    sx={{
                      border: "1px solid #f0f0f0",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                      },
                    }}
                  >
                    <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "16px !important" }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={player.profilePhotoUrl || player.profilePhoto}
                          alt={player.name}
                          sx={{ width: 50, height: 50, border: "2px solid #e2d8fd" }}
                        />
                        <Box>
                          <Typography variant="body1" fontWeight="600" color="text.primary">
                            {player.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            {/* <Group sx={{ fontSize: 14 }} /> Teammates */}
                          </Typography>
                        </Box>
                      </Box>
                      <GlobalButton
                        onClick={() => handleConnect(player._id)}
                        disabled={isSending || !!connectionStatus || isConnecting}
                        fullWidth={false}
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
                      </GlobalButton>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionHub;
