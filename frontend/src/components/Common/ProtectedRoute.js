import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../../services/auth';

const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to={requiredRole === 'admin' ? '/admin/login' : '/customer/login'} />;
  }

  const userRole = getUserRole();
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/customer'} />;
  }

  return children;
};

export default ProtectedRoute;