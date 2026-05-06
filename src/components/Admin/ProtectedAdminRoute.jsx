import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { isAdminAuthenticated } from '../../services/adminAuth';

export default function ProtectedAdminRoute() {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
