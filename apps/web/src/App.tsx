import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DEFAULT_CURRENCY } from '@swiftspend/types';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import { supabase } from './services/supabase.ts';

const Dashboard = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
      <h1 className="text-4xl font-extrabold text-blue-600 mb-4 tracking-tight">SwiftSpend</h1>
      <p className="text-gray-600 mb-6 text-lg">Your minimal personal expense tracker.</p>
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <p className="text-sm text-blue-800 font-medium">
          Base Currency: <span className="font-bold">{DEFAULT_CURRENCY}</span>
        </p>
      </div>
      <button 
        onClick={() => supabase.auth.signOut()}
        className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Sign Out
      </button>
    </div>
  </div>
);

// Callback component to handle OAuth redirection
const AuthCallback = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.location.href = '/';
      }
    });
    return () => subscription.unsubscribe();
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
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
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
