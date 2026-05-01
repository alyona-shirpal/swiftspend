import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AddExpensePage } from './pages/expenses/AddExpensePage';
import { AllCategoriesPage } from './pages/expenses/AllCategoriesPage';
import { DailyReportPage } from './pages/reports/DailyReportPage';
import { MonthlyReportPage } from './pages/reports/MonthlyReportPage';
import { YearlyReportPage } from './pages/reports/YearlyReportPage';
import { supabase } from './services/supabase.ts';
import { Toaster } from 'react-hot-toast';

// Callback component to handle OAuth redirection
const AuthCallback = () => {
  useEffect(() => {
    let isMounted = true;

    const finishSignIn = async () => {
      if (!supabase) {
        console.warn('Supabase not available - skipping OAuth callback');
        if (isMounted) {
          window.location.href = '/';
        }
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('OAuth callback exchange failed:', error);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (isMounted && session) {
        window.location.href = '/';
      }
    };

    finishSignIn();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/';
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/expenses/new"
            element={
              <ProtectedRoute>
                <AddExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/categories"
            element={
              <ProtectedRoute>
                <AllCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Navigate to="/reports/daily" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/daily"
            element={
              <ProtectedRoute>
                <DailyReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/monthly"
            element={
              <ProtectedRoute>
                <MonthlyReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/yearly"
            element={
              <ProtectedRoute>
                <YearlyReportPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
