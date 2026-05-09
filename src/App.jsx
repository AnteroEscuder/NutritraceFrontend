import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import FoodsPage from "./pages/FoodsPage";
import GoalsPage from "./pages/GoalsPage";
import MealsPage from "./pages/MealsPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CommunityChatPage from "./pages/CommunityChatPage";
import AppLayout from "./components/AppLayout";
import { ThemeModeProvider } from "./context/ThemeContext";
import NotFoundPage from "./pages/NotFoundPage";

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) return <p>Cargando sesión...</p>;
  if (!token) return <Navigate to="/auth" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/foods"
        element={
          <PrivateRoute>
            <AppLayout>
              <FoodsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <PrivateRoute>
            <AppLayout>
              <MealsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <PrivateRoute>
            <AppLayout>
              <GoalsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/community"
        element={
          <PrivateRoute>
            <CommunityChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeModeProvider>
  );
}
