import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-workbench-bg flex flex-col items-center justify-center text-workbench-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-workbench-cyan animate-spin" />
          <span className="text-xs font-mono text-workbench-muted">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnPath}`} replace />;
  }

  return <>{children}</>;
};
