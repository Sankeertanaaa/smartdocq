import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user?.role)) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getDashboardPath(user?.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin-dashboard';
    case 'student':
      return '/student-dashboard';
    case 'guest':
      return '/guest-dashboard';
    default:
      return '/login';
  }
};

export default ProtectedRoute;
