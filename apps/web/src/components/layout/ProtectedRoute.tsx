import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { data: currencies, isLoading: currenciesLoading } = useUserCurrencies();
  const location = useLocation();

  if (authLoading || (session && currenciesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currencies?.needs_onboarding) {
    return <Navigate to="/onboarding/currencies" replace />;
  }

  if (currencies?.needs_category_onboarding) {
    return <Navigate to="/onboarding/categories" replace />;
  }

  return <>{children}</>;
};
