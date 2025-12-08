import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import FoodsPage from "./pages/FoodsPage";
import GoalsPage from "./pages/GoalsPage";

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
        path="/foods"
        element={
          <PrivateRoute>
            <FoodsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <PrivateRoute>
            <GoalsPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/foods" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
