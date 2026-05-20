import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageSpinner } from './components/Spinner';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { StudentListPage } from './pages/StudentListPage';
import { StudentSetupPage } from './pages/StudentSetupPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { SessionSetupPage } from './pages/SessionSetupPage';
import { PreReadingPage } from './pages/PreReadingPage';
import { ReadingPage } from './pages/ReadingPage';
import { ReadingResultPage } from './pages/ReadingResultPage';
import { StudentFeedbackPage } from './pages/StudentFeedbackPage';
import { TutorFeedbackPage } from './pages/TutorFeedbackPage';
import { SessionCompletePage } from './pages/SessionCompletePage';
import { ArticleManagerPage } from './pages/ArticleManagerPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AccountManagerPage } from './pages/AccountManagerPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <SessionProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute><StudentListPage /></ProtectedRoute>} />
              <Route path="/students/new" element={<ProtectedRoute><StudentSetupPage /></ProtectedRoute>} />
              <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
              <Route path="/articles" element={<ProtectedRoute><ArticleManagerPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><AccountManagerPage /></ProtectedRoute>} />

              {/* Session flow */}
              <Route path="/session/setup" element={<ProtectedRoute><SessionSetupPage /></ProtectedRoute>} />
              <Route path="/session/:id/ready" element={<ProtectedRoute><PreReadingPage /></ProtectedRoute>} />
              <Route path="/session/:id/read/:articleOrder" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
              <Route path="/session/:id/result/:articleOrder" element={<ProtectedRoute><ReadingResultPage /></ProtectedRoute>} />
              <Route path="/session/:id/feedback/:articleOrder" element={<ProtectedRoute><StudentFeedbackPage /></ProtectedRoute>} />
              <Route path="/session/:id/tutor-feedback/:articleOrder" element={<ProtectedRoute><TutorFeedbackPage /></ProtectedRoute>} />
              <Route path="/session/:id/complete" element={<ProtectedRoute><SessionCompletePage /></ProtectedRoute>} />
            </Routes>
          </SessionProvider>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}

