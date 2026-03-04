import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import QuizLayout from '@/layouts/QuizLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const QuizPage = lazy(() => import('@/pages/QuizPage'));
const ResultPage = lazy(() => import('@/pages/ResultPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const SpecialQuizManagePage = lazy(() => import('@/pages/SpecialQuizManagePage'));
const JoinQuizPage = lazy(() => import('@/pages/JoinQuizPage'));
const LiveExamPage = lazy(() => import('@/pages/LiveExamPage'));
const LiveQuizRoomPage = lazy(() => import('@/pages/LiveQuizRoomPage'));
const LiveResultsPage = lazy(() => import('@/pages/LiveResultsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthLayout>
              <SignupPage />
            </AuthLayout>
          }
        />

        {/* Protected — standard layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <LeaderboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ResultPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Protected — quiz layout (no navbar) */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizLayout>
                <QuizPage />
              </QuizLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout>
                <AdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── PUBLIC: Live exam link (no login required) ── */}
        <Route path="/live/:id" element={<LiveExamPage />} />

        {/* Special Quizzes — admin only */}
        <Route
          path="/special-quizzes"
          element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout>
                <SpecialQuizManagePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Join a live quiz (any authenticated user) */}
        <Route
          path="/join"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JoinQuizPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/join/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JoinQuizPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Live quiz room */}
        <Route
          path="/live-quiz/:id"
          element={
            <ProtectedRoute>
              <QuizLayout>
                <LiveQuizRoomPage />
              </QuizLayout>
            </ProtectedRoute>
          }
        />

        {/* Live quiz results */}
        <Route
          path="/live-results/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <LiveResultsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
