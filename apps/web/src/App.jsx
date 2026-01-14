import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@tsc/supabase';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import SuperAdmin from './pages/SuperAdmin';
import Nutzungsbedingungen from './pages/Nutzungsbedingungen';
import Datenschutz from './pages/Datenschutz';
import PoweredByAitema from './components/PoweredByAitema';
import { CookieBanner } from '@tsc/ui';

// Module Imports
import Saisonplanung from './modules/saisonplanung';
import Startgelder from './modules/startgelder';
import Schadensmeldung from './modules/schadensmeldung';
import Eventanmeldung from './modules/eventanmeldung';
import Saisoncharter from './modules/saisoncharter';
import Jugendleistungsfonds from './modules/jugendleistungsfonds';
import Spendenportal from './modules/spendenportal';
import Jahresauswertung from './modules/jahresauswertung';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function SaisonplanungWrapper() {
  const navigate = useNavigate();
  return <Saisonplanung onBackToDashboard={() => navigate('/dashboard')} />;
}

function StartgelderWrapper() {
  const navigate = useNavigate();
  return <Startgelder onBackToDashboard={() => navigate('/dashboard')} />;
}

function SchadensmeldungWrapper() {
  const navigate = useNavigate();
  return <Schadensmeldung onBackToDashboard={() => navigate('/dashboard')} />;
}

function EventanmeldungWrapper() {
  const navigate = useNavigate();
  return <Eventanmeldung onBackToDashboard={() => navigate('/dashboard')} />;
}

function SaisoncharterWrapper() {
  const navigate = useNavigate();
  return <Saisoncharter onBackToDashboard={() => navigate('/dashboard')} />;
}

function JugendleistungsfondsWrapper() {
  const navigate = useNavigate();
  return <Jugendleistungsfonds onBackToDashboard={() => navigate('/dashboard')} />;
}

function SpendenportalWrapper() {
  const navigate = useNavigate();
  return <Spendenportal onBackToDashboard={() => navigate('/dashboard')} />;
}

function JahresauswertungWrapper() {
  const navigate = useNavigate();
  return <Jahresauswertung onBackToDashboard={() => navigate('/dashboard')} />;
}

export default function App() {
  return (
    <>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Legal Pages (Public) */}
      <Route path="/nutzungsbedingungen" element={<Nutzungsbedingungen />} />
      <Route path="/datenschutz" element={<Datenschutz />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      {/* Super Admin Route */}
      <Route
        path="/super-admin"
        element={
          <AdminRoute>
            <SuperAdmin />
          </AdminRoute>
        }
      />

      {/* Module Routes */}
      <Route
        path="/saisonplanung/*"
        element={
          <ProtectedRoute>
            <SaisonplanungWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/startgelder/*"
        element={
          <ProtectedRoute>
            <StartgelderWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schadensmeldung/*"
        element={
          <ProtectedRoute>
            <SchadensmeldungWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eventanmeldung/*"
        element={
          <ProtectedRoute>
            <EventanmeldungWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saisoncharter/*"
        element={
          <ProtectedRoute>
            <SaisoncharterWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jugendleistungsfonds/*"
        element={
          <ProtectedRoute>
            <JugendleistungsfondsWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spendenportal/*"
        element={
          <ProtectedRoute>
            <SpendenportalWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jahresauswertung/*"
        element={
          <ProtectedRoute>
            <JahresauswertungWrapper />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <PoweredByAitema />
    <CookieBanner />
    </>
  );
}
