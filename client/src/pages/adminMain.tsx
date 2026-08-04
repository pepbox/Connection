import { Route, Routes, useParams } from "react-router-dom";
import DashboardPage from "../features/admin/Pages/DshboardPage";
import LeaderboardPage from "../features/admin/Pages/LeaderboardPage";
import AdminLogin from "../features/admin/Pages/AdminLogin";
import Box from "@mui/material/Box";
import { useLazyFetchAdminQuery } from "../features/admin/services/admin.Api";
import { useAppSelector } from "../app/hooks";
import { RootState } from "../app/store";
import { useEffect } from "react";
import Loader from "../components/ui/Loader";
import AuthWrapper from "../components/auth/AuthWrapper";
import { useAppDispatch } from "../app/rootReducer";
import { setSessionId } from "../features/game/services/gameSlice";
import { clearAdmin } from "../features/admin/services/adminSlice";

const AdminMain = () => {
  const [FetchAdmin, { isUninitialized, isLoading: isAdminLoading }] = useLazyFetchAdminQuery();
  const { isAuthenticated, admin } = useAppSelector(
    (state: RootState) => state.admin
  );
  const dispatch = useAppDispatch();
  const sessionId = useParams<{ sessionId: string }>().sessionId;

  useEffect(() => {
    dispatch(setSessionId(sessionId ?? ""));
  }, [sessionId, dispatch]);

  useEffect(() => {
    FetchAdmin({});
  }, [isAuthenticated, FetchAdmin]);

  // Session verification: Ensure logged-in admin belongs to the requested route session
  useEffect(() => {
    if (isAuthenticated && admin && admin.sessionId && sessionId) {
      const adminSessionId =
        typeof admin.sessionId === "object" && admin.sessionId !== null
          ? (admin.sessionId as any)._id?.toString() || (admin.sessionId as any).id?.toString()
          : admin.sessionId.toString();

      if (adminSessionId !== sessionId.toString()) {
        console.warn("Session ID mismatch! Logging out admin from current session view.");
        dispatch(clearAdmin());
      }
    }
  }, [isAuthenticated, admin, sessionId, dispatch]);

  if (isUninitialized || isAdminLoading) {
    return <Loader />;
  }

  return (
    <Box sx={{ maxWidth: "100%", minHeight: "100vh" }}>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/"
          element={
            <AuthWrapper
              userType={"admin"}
              redirection={`/admin/${sessionId}/login`}
            />
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>
        <Route path={`/${sessionId}`} element={<AdminLogin />} />
      </Routes>
    </Box>
  );
};

export default AdminMain;
