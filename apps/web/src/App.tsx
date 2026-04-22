import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthProvider';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AddExpensePage from './pages/expenses/AddExpensePage';
import ExpenseListPage from './pages/expenses/ExpenseListPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import DailyReportPage from './pages/reports/DailyReportPage';
import MonthlyReportPage from './pages/reports/MonthlyReportPage';
import YearlyReportPage from './pages/reports/YearlyReportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Private Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/expenses" element={<ExpenseListPage />} />
                <Route path="/expenses/new" element={<AddExpensePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                
                {/* Reports */}
                <Route path="/reports/daily" element={<DailyReportPage />} />
                <Route path="/reports/monthly" element={<MonthlyReportPage />} />
                <Route path="/reports/yearly" element={<YearlyReportPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
